from flask import jsonify
from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from urllib.parse import quote
import os

app = Flask(__name__)

app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'cinematch_dev_secret_key')

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    avatar_path = db.Column(db.String(255))
    backdrop_path = db.Column(db.String(255))

    def __repr__(self):
        return f'<User {self.username}>'

class UserMovie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False) # Hangi kullanıcı ekledi
    movie_id = db.Column(db.Integer, nullable=False) # TMDB'deki film ID'si
    title = db.Column(db.String(200), nullable=False) # Filmin adı
    poster = db.Column(db.String(200)) # Afiş linki
    action = db.Column(db.String(50)) # 'izlendi', 'favori' veya 'izlenecek'

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    username = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class CommentLike(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, nullable=False, index=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    __table_args__ = (db.UniqueConstraint('comment_id', 'user_id', name='unique_comment_like'),)


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, nullable=False, index=True)
    movie_title = db.Column(db.String(200), nullable=False)
    poster = db.Column(db.String(255))
    backdrop = db.Column(db.String(255))
    user_id = db.Column(db.Integer, nullable=False, index=True)
    username = db.Column(db.String(50), nullable=False)
    rating = db.Column(db.Float, nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class ReviewLike(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, nullable=False, index=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    __table_args__ = (db.UniqueConstraint('review_id', 'user_id', name='unique_review_like'),)


class ReviewReply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, nullable=False, index=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    username = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Follow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, nullable=False, index=True)
    followed_id = db.Column(db.Integer, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    __table_args__ = (db.UniqueConstraint('follower_id', 'followed_id', name='unique_follow'),)


class MoodResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    mood_key = db.Column(db.String(80), nullable=False)
    mood_label = db.Column(db.String(160), nullable=False)
    mood_jargon = db.Column(db.String(255))
    movie_id = db.Column(db.Integer, nullable=False, index=True)
    movie_title = db.Column(db.String(200), nullable=False)
    poster = db.Column(db.String(255))
    backdrop = db.Column(db.String(255))
    overview = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


def ensure_schema():
    db.create_all()
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()

    if 'user' not in tables:
        return

    user_columns = {column['name'] for column in inspector.get_columns('user')}
    with db.engine.begin() as connection:
        if 'avatar_path' not in user_columns:
            connection.exec_driver_sql("ALTER TABLE user ADD COLUMN avatar_path VARCHAR(255)")
        if 'backdrop_path' not in user_columns:
            connection.exec_driver_sql("ALTER TABLE user ADD COLUMN backdrop_path VARCHAR(255)")


def current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None

    user = User.query.get(user_id)
    if not user:
        session.clear()
    return user


def profile_url(username):
    return f"/profile/{quote(username or '')}"


def history_date_label(created_at):
    today = datetime.now().date()
    result_date = created_at.date()
    if result_date == today:
        return "Bugün"
    if result_date == today - timedelta(days=1):
        return "Dün"
    return created_at.strftime("%d.%m.%Y")


def build_mood_history_groups(results):
    groups = {}
    for result in results:
        key = (result.created_at.date().isoformat(), result.mood_key, result.mood_label)
        if key not in groups:
            groups[key] = {
                "date_label": history_date_label(result.created_at),
                "date_text": result.created_at.strftime("%d.%m.%Y"),
                "mood_label": result.mood_label,
                "mood_jargon": result.mood_jargon,
                "movies": []
            }
        groups[key]["movies"].append(result)

    return list(groups.values())


def serialize_public_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "avatar_path": user.avatar_path,
        "profile_url": profile_url(user.username)
    }


def serialize_discover_user(user, followed_ids=None):
    followed_ids = followed_ids or set()
    return {
        **serialize_public_user(user),
        "is_following": user.id in followed_ids,
        "followers_count": Follow.query.filter_by(followed_id=user.id).count(),
        "following_count": Follow.query.filter_by(follower_id=user.id).count(),
        "review_count": Review.query.filter_by(user_id=user.id).count()
    }


def author_payload(user_id, fallback_username):
    author = User.query.get(user_id)
    username = author.username if author else fallback_username
    return {
        "user_id": author.id if author else user_id,
        "username": username,
        "avatar_path": author.avatar_path if author else None,
        "profile_url": profile_url(username)
    }


def serialize_comment(comment, viewer_id=None):
    like_count = CommentLike.query.filter_by(comment_id=comment.id).count()
    liked_by_me = False
    if viewer_id:
        liked_by_me = CommentLike.query.filter_by(comment_id=comment.id, user_id=viewer_id).first() is not None
    author = author_payload(comment.user_id, comment.username)

    return {
        "id": comment.id,
        "movie_id": comment.movie_id,
        "user_id": author["user_id"],
        "username": author["username"],
        "avatar_path": author["avatar_path"],
        "profile_url": author["profile_url"],
        "content": comment.content,
        "created_at": comment.created_at.strftime("%d.%m.%Y %H:%M"),
        "like_count": like_count,
        "liked_by_me": liked_by_me,
        "can_delete": viewer_id == comment.user_id,
        "can_edit": viewer_id == comment.user_id
    }


def serialize_reply(reply, viewer_id=None):
    author = author_payload(reply.user_id, reply.username)
    return {
        "id": reply.id,
        "user_id": author["user_id"],
        "username": author["username"],
        "avatar_path": author["avatar_path"],
        "profile_url": author["profile_url"],
        "content": reply.content,
        "created_at": reply.created_at.strftime("%d.%m.%Y %H:%M"),
        "can_delete": viewer_id == reply.user_id
    }


def serialize_review(review, viewer_id=None, include_replies=True):
    like_count = ReviewLike.query.filter_by(review_id=review.id).count()
    reply_query = ReviewReply.query.filter_by(review_id=review.id).order_by(ReviewReply.created_at.asc())
    replies = reply_query.all() if include_replies else []
    liked_by_me = False
    if viewer_id:
        liked_by_me = ReviewLike.query.filter_by(review_id=review.id, user_id=viewer_id).first() is not None
    author = author_payload(review.user_id, review.username)

    return {
        "id": review.id,
        "movie_id": review.movie_id,
        "movie_title": review.movie_title,
        "poster": review.poster,
        "backdrop": review.backdrop,
        "user_id": author["user_id"],
        "username": author["username"],
        "avatar_path": author["avatar_path"],
        "profile_url": author["profile_url"],
        "rating": review.rating,
        "content": review.content,
        "created_at": review.created_at.strftime("%d.%m.%Y %H:%M"),
        "updated_at": review.updated_at.strftime("%d.%m.%Y %H:%M"),
        "like_count": like_count,
        "reply_count": reply_query.count() if not include_replies else len(replies),
        "liked_by_me": liked_by_me,
        "can_delete": viewer_id == review.user_id,
        "can_edit": viewer_id == review.user_id,
        "replies": [serialize_reply(reply, viewer_id) for reply in replies]
    }


def short_activity_date(created_at):
    label = history_date_label(created_at)
    if label in ("Bugün", "Dün"):
        return f"{label} {created_at.strftime('%H:%M')}"
    return created_at.strftime("%d.%m.%Y")


def serialize_discover_review(review, viewer_id=None):
    data = serialize_review(review, viewer_id, include_replies=False)
    author = User.query.get(review.user_id)
    data.update({
        "username": author.username if author else review.username,
        "avatar_path": author.avatar_path if author else None,
        "profile_url": profile_url(author.username if author else review.username),
        "created_label": short_activity_date(review.created_at)
    })
    return data


def serialize_discover_comment(comment, viewer_id=None):
    author = User.query.get(comment.user_id)
    data = serialize_comment(comment, viewer_id)
    data.update({
        "username": author.username if author else comment.username,
        "avatar_path": author.avatar_path if author else None,
        "profile_url": profile_url(author.username if author else comment.username),
        "created_label": short_activity_date(comment.created_at)
    })
    return data


def allowed_avatar_file(filename):
    allowed = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed


DISCOVER_CATEGORY_GROUPS = [
    {
        "title": "Temel Türler",
        "items": [
            {"id": "aksiyon", "name": "Aksiyon"},
            {"id": "macera", "name": "Macera"},
            {"id": "animasyon", "name": "Animasyon"},
            {"id": "komedi", "name": "Komedi"},
            {"id": "suc", "name": "Suç"},
            {"id": "polisiye", "name": "Polisiye"},
            {"id": "belgesel", "name": "Belgesel"},
            {"id": "dram", "name": "Dram"},
            {"id": "aile", "name": "Aile"},
            {"id": "fantastik", "name": "Fantastik"},
            {"id": "tarih", "name": "Tarih"},
            {"id": "korku", "name": "Korku"},
            {"id": "muzik", "name": "Müzik"},
            {"id": "gizem", "name": "Gizem"},
            {"id": "romantik", "name": "Romantik"},
            {"id": "bilim_kurgu", "name": "Bilim Kurgu"},
            {"id": "gerilim", "name": "Gerilim"},
            {"id": "savas", "name": "Savaş"},
            {"id": "vahsi_bati", "name": "Vahşi Batı"}
        ]
    },
    {
        "title": "Hikaye Temaları",
        "items": [
            {"id": "uzay", "name": "Uzay"},
            {"id": "zaman_yolculugu", "name": "Zaman Yolculuğu"},
            {"id": "soygun", "name": "Soygun"},
            {"id": "psikolojik", "name": "Psikolojik"},
            {"id": "distopya", "name": "Distopya"},
            {"id": "mafya", "name": "Mafya"},
            {"id": "hacker", "name": "Dijital Kaos"},
            {"id": "hayatta_kalma", "name": "Hayatta Kalma"},
            {"id": "seri_katil", "name": "Seri Katil"},
            {"id": "yapay_zeka", "name": "Yapay Zeka"},
            {"id": "post_apocalyptic", "name": "Post Apokaliptik"},
            {"id": "cyberpunk", "name": "Cyberpunk"},
            {"id": "intikam", "name": "İntikam"}
        ]
    },
    {
        "title": "Mod ve Stil",
        "items": [
            {"id": "anime", "name": "Anime"},
            {"id": "bagimsiz", "name": "Bağımsız"},
            {"id": "kult", "name": "Kült"},
            {"id": "ters_kose", "name": "Ters Köşe"},
            {"id": "cerezlik", "name": "Çerezlik"},
            {"id": "uzun_basyapit", "name": "Uzun Başyapıt"},
            {"id": "slowburn", "name": "Düşük Tempolu"},
            {"id": "beyin_yakan", "name": "Beyin Yakan"},
            {"id": "cozy", "name": "İç Isıtan"},
            {"id": "karanlik", "name": "Karanlık"},
            {"id": "depresif", "name": "Depresif"},
            {"id": "ilham_veren", "name": "İlham Veren"},
            {"id": "arthouse", "name": "Sanat Filmi"},
            {"id": "deneysel", "name": "Alışılmışın Dışında"}
        ]
    },
    {
        "title": "Karakter Odağı",
        "items": [
            {"id": "antihero", "name": "Kusurlu Kahraman"},
            {"id": "coming_of_age", "name": "Kendini Bulma"}
        ]
    },
    {
        "title": "Dünya Sineması",
        "items": [
            {"id": "tr", "name": "Türk Sineması"},
            {"id": "yesilcam", "name": "Yeşilçam Filmleri"},
            {"id": "ko", "name": "Kore Sineması"},
            {"id": "fa", "name": "İran Sineması"},
            {"id": "iskandinav", "name": "İskandinav Sineması"},
            {"id": "japon", "name": "Japon Sineması"},
            {"id": "fransiz", "name": "Fransız Sineması"},
            {"id": "italyan", "name": "İtalyan Sineması"},
            {"id": "hint", "name": "Hint Sineması"},
            {"id": "ispanyol", "name": "İspanyol Sineması"},
            {"id": "alman", "name": "Alman Sineması"},
            {"id": "cin", "name": "Çin Sineması"},
            {"id": "hong_kong", "name": "Hong Kong Sineması"},
            {"id": "latin_amerika", "name": "Latin Amerika Sineması"}
        ]
    },
    {
        "title": "Özel Seçkiler",
        "items": [
            {"id": "romantik_komedi", "name": "Romantik Komedi"},
            {"id": "edebi_uyarlama", "name": "Edebi Uyarlama"},
            {"id": "oscar_secisi", "name": "Oscar Ödüllü"},
            {"id": "festival_odullu", "name": "Festival Ödüllü"}
        ]
    }
]

CATEGORY_IMAGE_CLASSES = {
    "aksiyon": "g-action",
    "macera": "g-adventure",
    "animasyon": "g-animation",
    "komedi": "g-comedy",
    "suc": "g-crime",
    "polisiye": "g-police",
    "belgesel": "g-doc",
    "dram": "g-drama",
    "aile": "g-family",
    "fantastik": "g-fantasy",
    "tarih": "g-history",
    "korku": "g-horror",
    "muzik": "g-music",
    "gizem": "g-mystery",
    "romantik": "g-romance",
    "bilim_kurgu": "g-scifi",
    "gerilim": "g-thriller",
    "savas": "g-war",
    "vahsi_bati": "g-western",
    "uzay": "g-space",
    "zaman_yolculugu": "g-time-travel",
    "soygun": "g-heist",
    "psikolojik": "g-psychological",
    "distopya": "g-dystopia",
    "mafya": "g-mafia",
    "hacker": "g-hacker",
    "hayatta_kalma": "g-survival",
    "seri_katil": "g-serial",
    "yapay_zeka": "g-ai",
    "post_apocalyptic": "g-post",
    "cyberpunk": "g-cyberpunk",
    "intikam": "g-revenge",
    "anime": "g-anime",
    "bagimsiz": "g-indie",
    "kult": "g-cult",
    "ters_kose": "g-opposite",
    "cerezlik": "g-short",
    "uzun_basyapit": "g-long",
    "slowburn": "g-slowburn",
    "beyin_yakan": "g-mind",
    "cozy": "g-cozy",
    "karanlik": "g-dark",
    "depresif": "g-depressive",
    "ilham_veren": "g-inspiring",
    "arthouse": "g-arthouse",
    "deneysel": "g-experimental",
    "antihero": "g-antihero",
    "coming_of_age": "g-coming",
    "tr": "g-turkish",
    "yesilcam": "g-yesilcam",
    "ko": "g-korean",
    "fa": "g-iranian",
    "iskandinav": "g-scandinavian",
    "japon": "g-japanese",
    "fransiz": "g-french",
    "italyan": "g-italian",
    "hint": "g-indian",
    "ispanyol": "g-spanish",
    "alman": "g-german",
    "cin": "g-chinese",
    "hong_kong": "g-hongkong",
    "latin_amerika": "g-latin",
    "romantik_komedi": "g-romcom",
    "edebi_uyarlama": "g-literary",
    "oscar_secisi": "g-awards",
    "festival_odullu": "g-festival"
}



@app.route('/')
def ana_sayfa():
    return render_template('index.html', viewer=current_user())


@app.route('/kesfet')
def kesfet():
    viewer = current_user()
    if not viewer:
        return redirect(url_for('ana_sayfa'))

    followed_ids = [
        row.followed_id
        for row in Follow.query.filter_by(follower_id=viewer.id).order_by(Follow.created_at.desc()).all()
    ]
    followed_id_set = set(followed_ids)
    followed_reviews = []
    if followed_ids:
        followed_reviews = Review.query.filter(Review.user_id.in_(followed_ids)).order_by(Review.created_at.desc()).limit(6).all()

    recent_reviews = Review.query.order_by(Review.created_at.desc()).limit(6).all()
    popular_review_rows = (
        db.session.query(Review, db.func.count(ReviewLike.id).label("like_total"))
        .outerjoin(ReviewLike, ReviewLike.review_id == Review.id)
        .group_by(Review.id)
        .order_by(db.desc("like_total"), Review.created_at.desc())
        .limit(4)
        .all()
    )
    recent_comments = Comment.query.order_by(Comment.created_at.desc()).limit(6).all()
    discover_users = User.query.filter(User.id != viewer.id).order_by(User.username.asc()).all()

    stats = {
        "watched": UserMovie.query.filter_by(user_id=viewer.id, action='izlendi').count(),
        "favorites": UserMovie.query.filter_by(user_id=viewer.id, action='favori').count(),
        "watchlist": UserMovie.query.filter_by(user_id=viewer.id, action='izlenecek').count(),
        "reviews": Review.query.filter_by(user_id=viewer.id).count(),
        "following": len(followed_ids)
    }

    return render_template(
        'discover.html',
        viewer=viewer,
        category_groups=DISCOVER_CATEGORY_GROUPS,
        category_classes=CATEGORY_IMAGE_CLASSES,
        stats=stats,
        followed_reviews=[serialize_discover_review(review, viewer.id) for review in followed_reviews],
        recent_reviews=[serialize_discover_review(review, viewer.id) for review in recent_reviews],
        popular_reviews=[serialize_discover_review(review, viewer.id) for review, _ in popular_review_rows],
        recent_comments=[serialize_discover_comment(comment, viewer.id) for comment in recent_comments],
        discover_users=[serialize_discover_user(user, followed_id_set) for user in discover_users]
    )


@app.route('/mood-gecmisim')
def mood_gecmisim():
    viewer = current_user()
    if not viewer:
        flash("Mood geçmişini görmek için önce giriş yapmalısın.")
        return redirect(url_for('ana_sayfa'))

    results = MoodResult.query.filter_by(user_id=viewer.id).order_by(MoodResult.created_at.desc()).limit(80).all()
    return render_template(
        'mood-history.html',
        viewer=viewer,
        history_groups=build_mood_history_groups(results),
        history_count=len(results)
    )

@app.route('/register', methods=['POST'])
def kayit_ol():
    username = (request.form.get('username') or '').strip()
    email = (request.form.get('email') or '').strip().lower()
    password = request.form.get('password')

    if not username or not email or not password:
        flash("Kullanıcı adı, e-posta ve şifre zorunlu.")
        return redirect(url_for('ana_sayfa'))

    if len(username) > 50:
        flash("Kullanıcı adı en fazla 50 karakter olabilir.")
        return redirect(url_for('ana_sayfa'))

    if any(char.isspace() for char in username):
        flash("Kullanıcı adı boşluk içeremez.")
        return redirect(url_for('ana_sayfa'))

    if any(char in username for char in '/\\?#'):
        flash("Kullanıcı adında /, \\, ? veya # kullanma.")
        return redirect(url_for('ana_sayfa'))

    username_exists = User.query.filter(db.func.lower(User.username) == username.lower()).first()
    if username_exists:
        flash("Bu kullanıcı adı alınmış.")
        return redirect(url_for('ana_sayfa'))

    user_exists = User.query.filter(db.func.lower(User.email) == email).first()
    if user_exists:
        flash("Bu e-posta zaten kayıtlı!")
        return redirect(url_for('ana_sayfa'))

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()

    session['user_id'] = new_user.id
    session['username'] = new_user.username

    print(f"Yeni kullanıcı eklendi: {username}")
    return redirect(url_for('profil_sayfasi', isim=username))


@app.route('/login', methods=['POST'])
def giris_yap():
    email = request.form.get('email')
    password = request.form.get('password')
    next_url = request.args.get('next')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['username'] = user.username
        if next_url and next_url.startswith('/'):
            return redirect(next_url)
        return redirect(url_for('profil_sayfasi', isim=user.username))
    else:
        flash("E-posta veya şifre hatalı!")
        return redirect(url_for('ana_sayfa'))

@app.route('/logout')
def logout():
    session.clear() 
    return redirect(url_for('ana_sayfa'))

@app.route('/kategoriler')
def kategoriler():
    return render_template('genre.html')

@app.route('/detay')
def film_detay():
    return render_template('movie-detail.html')

@app.route('/iletisim')
def iletisim():
    return render_template('contact.html')
# --- app.py GÜNCELLEME ---

@app.route('/film_kaydet', methods=['POST'])
def film_kaydet():
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Giriş yapın"}), 401
    
    veri = request.json
    user_id = user.id
    movie_id = veri['movie_id']
    action = veri.get('action')
    mode = veri.get('mode', 'add')

    if not action:
        mevcut_film = UserMovie.query.filter_by(user_id=user_id, movie_id=movie_id).first()

        if mevcut_film:
            db.session.delete(mevcut_film)
            db.session.commit()
            return jsonify({"success": True, "action": "deleted", "mesaj": "Film listenden kaldırıldı!"})

        return jsonify({"success": False, "error": "İşlem tipi eksik"}), 400

    mevcut_film = UserMovie.query.filter_by(user_id=user_id, movie_id=movie_id, action=action).first()

    if mode == 'delete':
        if not mevcut_film:
            return jsonify({"success": True, "action": "missing", "mesaj": "Film zaten listede yok."})
        db.session.delete(mevcut_film)
        db.session.commit()
        return jsonify({"success": True, "action": "deleted", "mesaj": "Film listenden kaldırıldı!"})

    if mevcut_film:
        return jsonify({"success": True, "action": "exists", "mesaj": "Film bu listede zaten var."})

    yeni_kayit = UserMovie(
        user_id=user_id,
        movie_id=movie_id,
        title=veri['title'],
        poster=veri['poster'],
        action=action
    )
    db.session.add(yeni_kayit)
    db.session.commit()
    return jsonify({"success": True, "action": "added", "mesaj": "Film başarıyla eklendi!"})

@app.route('/api/session')
def api_session():
    user = current_user()
    return jsonify({
        "logged_in": user is not None,
        "username": user.username if user else None,
        "profile_url": profile_url(user.username) if user else None
    })

@app.route('/api/comments/<int:movie_id>', methods=['GET', 'POST'])
def api_comments(movie_id):
    viewer = current_user()

    if request.method == 'GET':
        comments = Comment.query.filter_by(movie_id=movie_id).order_by(Comment.created_at.desc()).all()
        return jsonify({
            "comments": [serialize_comment(comment, viewer.id if viewer else None) for comment in comments]
        })

    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Yorum yapmak için giriş yapın."}), 401

    content = (request.json.get('content') or '').strip()
    if len(content) < 2:
        return jsonify({"success": False, "error": "Yorum çok kısa."}), 400

    comment = Comment(
        movie_id=movie_id,
        user_id=viewer.id,
        username=viewer.username,
        content=content[:1000]
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify({
        "success": True,
        "comment": serialize_comment(comment, viewer.id)
    })


@app.route('/api/comments/<int:comment_id>/like', methods=['POST'])
def api_comment_like(comment_id):
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Beğeni için giriş yapın."}), 401

    comment = Comment.query.get_or_404(comment_id)
    like = CommentLike.query.filter_by(comment_id=comment.id, user_id=user.id).first()

    if like:
        db.session.delete(like)
        liked = False
    else:
        db.session.add(CommentLike(comment_id=comment.id, user_id=user.id))
        liked = True

    db.session.commit()
    return jsonify({
        "success": True,
        "liked": liked,
        "like_count": CommentLike.query.filter_by(comment_id=comment.id).count()
    })


@app.route('/api/comments/<int:comment_id>', methods=['PUT', 'PATCH'])
def api_comment_update(comment_id):
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Yorumu düzenlemek için giriş yapın."}), 401

    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != user.id:
        return jsonify({"success": False, "error": "Bu yorumu sadece sahibi düzenleyebilir."}), 403

    content = ((request.get_json(silent=True) or {}).get('content') or '').strip()
    if len(content) < 2:
        return jsonify({"success": False, "error": "Yorum çok kısa."}), 400

    comment.content = content[:1000]
    db.session.commit()
    return jsonify({"success": True, "comment": serialize_comment(comment, user.id)})


@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def api_comment_delete(comment_id):
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Yorum silmek için giriş yapın."}), 401

    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != user.id:
        return jsonify({"success": False, "error": "Bu yorumu sadece sahibi silebilir."}), 403

    CommentLike.query.filter_by(comment_id=comment.id).delete()
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"success": True})


@app.route('/api/reviews/<int:movie_id>', methods=['GET', 'POST'])
def api_reviews(movie_id):
    viewer = current_user()

    if request.method == 'GET':
        reviews = Review.query.filter_by(movie_id=movie_id).order_by(Review.created_at.desc()).all()
        avg_rating = None
        if reviews:
            avg_rating = round(sum(review.rating for review in reviews) / len(reviews), 1)

        return jsonify({
            "reviews": [serialize_review(review, viewer.id if viewer else None) for review in reviews],
            "average_rating": avg_rating,
            "review_count": len(reviews)
        })

    if not viewer:
        return jsonify({"success": False, "error": "İnceleme yazmak için giriş yapın."}), 401

    data = request.get_json(silent=True) or {}
    content = (data.get('content') or '').strip()
    movie_title = (data.get('movie_title') or 'İsimsiz Film').strip()[:200]
    poster = (data.get('poster') or '').strip()[:255]
    backdrop = (data.get('backdrop') or '').strip()[:255]

    try:
        rating = float(data.get('rating'))
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Puan seçmelisin."}), 400

    if rating < 0.5 or rating > 5:
        return jsonify({"success": False, "error": "Puan 0.5 ile 5 arasında olmalı."}), 400

    if len(content) < 5:
        return jsonify({"success": False, "error": "İnceleme biraz daha uzun olmalı."}), 400

    review = Review.query.filter_by(movie_id=movie_id, user_id=viewer.id).first()
    if review:
        review.movie_title = movie_title
        review.poster = poster
        review.backdrop = backdrop
        review.rating = rating
        review.content = content[:2500]
        review.updated_at = datetime.utcnow()
    else:
        review = Review(
            movie_id=movie_id,
            movie_title=movie_title,
            poster=poster,
            backdrop=backdrop,
            user_id=viewer.id,
            username=viewer.username,
            rating=rating,
            content=content[:2500]
        )
        db.session.add(review)

    watched = UserMovie.query.filter_by(user_id=viewer.id, movie_id=movie_id, action='izlendi').first()
    if not watched:
        db.session.add(UserMovie(
            user_id=viewer.id,
            movie_id=movie_id,
            title=movie_title,
            poster=poster,
            action='izlendi'
        ))

    db.session.commit()
    return jsonify({"success": True, "review": serialize_review(review, viewer.id)})


@app.route('/api/reviews/<int:review_id>/like', methods=['POST'])
def api_review_like(review_id):
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Beğeni için giriş yapın."}), 401

    review = Review.query.get_or_404(review_id)
    like = ReviewLike.query.filter_by(review_id=review.id, user_id=user.id).first()

    if like:
        db.session.delete(like)
        liked = False
    else:
        db.session.add(ReviewLike(review_id=review.id, user_id=user.id))
        liked = True

    db.session.commit()
    return jsonify({
        "success": True,
        "liked": liked,
        "like_count": ReviewLike.query.filter_by(review_id=review.id).count()
    })


@app.route('/api/reviews/<int:review_id>/replies', methods=['POST'])
def api_review_reply(review_id):
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Cevap yazmak için giriş yapın."}), 401

    Review.query.get_or_404(review_id)
    content = ((request.get_json(silent=True) or {}).get('content') or '').strip()
    if len(content) < 2:
        return jsonify({"success": False, "error": "Cevap çok kısa."}), 400

    reply = ReviewReply(
        review_id=review_id,
        user_id=user.id,
        username=user.username,
        content=content[:800]
    )
    db.session.add(reply)
    db.session.commit()
    return jsonify({"success": True, "reply": serialize_reply(reply, user.id)})


@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
def api_review_delete(review_id):
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "İnceleme silmek için giriş yapın."}), 401

    review = Review.query.get_or_404(review_id)
    if review.user_id != user.id:
        return jsonify({"success": False, "error": "Bu incelemeyi sadece sahibi silebilir."}), 403

    ReviewLike.query.filter_by(review_id=review.id).delete()
    ReviewReply.query.filter_by(review_id=review.id).delete()
    db.session.delete(review)
    db.session.commit()
    return jsonify({"success": True})


@app.route('/api/review-replies/<int:reply_id>', methods=['DELETE'])
def api_review_reply_delete(reply_id):
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Cevap silmek için giriş yapın."}), 401

    reply = ReviewReply.query.get_or_404(reply_id)
    if reply.user_id != user.id:
        return jsonify({"success": False, "error": "Bu cevabı sadece sahibi silebilir."}), 403

    db.session.delete(reply)
    db.session.commit()
    return jsonify({"success": True})


@app.route('/api/follow/<int:user_id>', methods=['POST'])
def api_follow(user_id):
    viewer = current_user()
    if not viewer:
        return jsonify({"success": False, "error": "Takip etmek için giriş yapın."}), 401

    target = User.query.get_or_404(user_id)
    if target.id == viewer.id:
        return jsonify({"success": False, "error": "Kendini takip edemezsin."}), 400

    follow = Follow.query.filter_by(follower_id=viewer.id, followed_id=target.id).first()
    if follow:
        db.session.delete(follow)
        following = False
    else:
        db.session.add(Follow(follower_id=viewer.id, followed_id=target.id))
        following = True

    db.session.commit()
    return jsonify({
        "success": True,
        "following": following,
        "followers_count": Follow.query.filter_by(followed_id=target.id).count(),
        "following_count": Follow.query.filter_by(follower_id=target.id).count()
    })


@app.route('/api/mood-results', methods=['POST'])
def api_mood_results():
    viewer = current_user()
    if not viewer:
        return jsonify({"success": False, "error": "Mood geçmişi için giriş yapın."}), 401

    data = request.get_json(silent=True) or {}
    try:
        movie_id = int(data.get('movie_id'))
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Film bilgisi eksik."}), 400

    movie_title = (data.get('movie_title') or '').strip()
    mood_key = (data.get('mood_key') or 'unknown').strip()[:80]
    mood_label = (data.get('mood_label') or 'Mood sonucu').strip()[:160]

    if not movie_title:
        return jsonify({"success": False, "error": "Film adı eksik."}), 400

    result = MoodResult(
        user_id=viewer.id,
        mood_key=mood_key,
        mood_label=mood_label,
        mood_jargon=(data.get('mood_jargon') or '').strip()[:255],
        movie_id=movie_id,
        movie_title=movie_title[:200],
        poster=(data.get('poster') or '').strip()[:255],
        backdrop=(data.get('backdrop') or '').strip()[:255],
        overview=(data.get('overview') or '').strip()[:1000]
    )
    db.session.add(result)
    db.session.commit()

    return jsonify({"success": True, "id": result.id})


@app.route('/profile/update', methods=['POST'])
def profil_guncelle():
    user = current_user()
    if not user:
        flash("Lütfen önce giriş yapın.")
        return redirect(url_for('ana_sayfa'))

    avatar = request.files.get('avatar')
    if avatar and avatar.filename:
        if not allowed_avatar_file(avatar.filename):
            flash("Profil fotoğrafı için png, jpg, jpeg, webp veya gif yükleyebilirsin.")
            return redirect(url_for('profil_sayfasi', isim=user.username))

        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        extension = secure_filename(avatar.filename).rsplit('.', 1)[1].lower()
        filename = f"user_{user.id}_{int(datetime.utcnow().timestamp())}.{extension}"
        avatar.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        user.avatar_path = f"uploads/{filename}"

    backdrop_path = (request.form.get('backdrop_path') or '').strip()
    if backdrop_path:
        user.backdrop_path = backdrop_path[:255]

    if request.form.get('clear_backdrop') == '1':
        user.backdrop_path = None

    db.session.commit()
    flash("Profil güncellendi.")
    return redirect(url_for('profil_sayfasi', isim=user.username))


@app.route('/profile/<isim>')
def profil_sayfasi(isim):
    # 1. Kullanıcı giriş yapmamışsa uyar ve ana sayfaya at
    user = current_user()
    if not user:
        flash("Lütfen önce giriş yapın.")
        return redirect(url_for('ana_sayfa'))
    
    # 2. Giriş yapmışsa veritabanından bu kullanıcının filmlerini çek
    viewer = user
    user = User.query.filter_by(username=isim).first_or_404()
    own_profile = viewer.id == user.id
    user_id = user.id
    izlenen_filmler = UserMovie.query.filter_by(user_id=user_id, action='izlendi').all()
    izlenecek_filmler = UserMovie.query.filter_by(user_id=user_id, action='izlenecek').all()
    favori_filmler = UserMovie.query.filter_by(user_id=user_id, action='favori').all()
    yorum_sayisi = Comment.query.filter_by(user_id=user_id).count()
    yorumlar = Comment.query.filter_by(user_id=user_id).order_by(Comment.created_at.desc()).limit(30).all()
    profil_yorumlari = [
        {
            "id": yorum.id,
            "movie_id": yorum.movie_id,
            "content": yorum.content,
            "created_at": yorum.created_at.strftime("%d.%m.%Y %H:%M")
        }
        for yorum in yorumlar
    ]
    incelemeler = Review.query.filter_by(user_id=user_id).order_by(Review.created_at.desc()).all()
    profil_incelemeleri = [serialize_review(review, user_id, include_replies=False) for review in incelemeler]
    follower_rows = Follow.query.filter_by(followed_id=user_id).order_by(Follow.created_at.desc()).all()
    following_rows = Follow.query.filter_by(follower_id=user_id).order_by(Follow.created_at.desc()).all()
    followers = []
    following = []
    for follow in follower_rows:
        follower = User.query.get(follow.follower_id)
        if follower:
            followers.append(serialize_public_user(follower))
    for follow in following_rows:
        followed = User.query.get(follow.followed_id)
        if followed:
            following.append(serialize_public_user(followed))
    is_following = False
    if not own_profile:
        is_following = Follow.query.filter_by(follower_id=viewer.id, followed_id=user_id).first() is not None
    
    # 3. HTML'e hem kullanıcının ismini hem de filmlerini gönder
    return render_template(
        'profile.html',
        isim=user.username,
        user=user,
        viewer=viewer,
        own_profile=own_profile,
        filmler=izlenen_filmler,
        izlenecekler=izlenecek_filmler,
        favoriler=favori_filmler,
        yorum_sayisi=yorum_sayisi,
        yorumlar=profil_yorumlari,
        incelemeler=profil_incelemeleri,
        followers=followers,
        following=following,
        is_following=is_following
    )

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

with app.app_context():
    ensure_schema()

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Yeni tabloları oluşturur
    app.run(debug=True)


