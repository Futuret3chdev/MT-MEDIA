from flask import Flask, jsonify, request
import mysql.connector
from mysql.connector import pooling, Error
import logging
from datetime import datetime, timedelta
import os
import re
from collections import defaultdict
import time
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Get the directory where this script lives (/root/bot)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Create a logs folder if it doesn't exist
LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# Use relative log file in the logs subfolder
LOG_FILE = os.path.join(LOG_DIR, 'memetorrent_api.log')

# Flask app - use instance_path relative to script
app = Flask(__name__, instance_path=os.path.join(BASE_DIR, 'instance'))

# Logging setup - relative file
logging.basicConfig(
    level=logging.DEBUG,
    filename=LOG_FILE,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logger.debug("Flask app initialized on VPS")

# === SHARED DATABASE CONFIG (SAFE FOR 20+ BOTS) ===
SHARED_DB_CONFIG = {
    'host': '50.6.160.248',
    'user': 'tcvkxete_admin',
    'password': 'Shinhwa1@@',
    'port': 3306,
    'raise_on_warnings': True,
    'use_pure': True,
    'connection_timeout': 60,  # Longer timeout for SSL handshake
    'pool_name': 'shared_pool',
    'pool_size': 1,            # CRITICAL: Only 1 connection to avoid max_user_connections limit
    'pool_reset_session': True,
    # === SSL FIX: Force SSL + skip certificate validation ===
    'ssl_ca': None,
    'ssl_verify_cert': False,  # Skips bad/self-signed cert errors
    'ssl_disabled': False      # Explicitly enable SSL
}

# === INIT SHARED POOL ===
def init_shared_pool():
    attempts = 5  # More attempts to handle flaky connections
    for attempt in range(1, attempts + 1):
        try:
            pool = pooling.MySQLConnectionPool(**SHARED_DB_CONFIG)
            logger.info(f"SHARED POOL initialized (size=1 - safe for many bots)")
            return pool
        except Error as e:
            logger.error(f"Pool init attempt {attempt} failed: {e}")
            if attempt == attempts:
                raise
            time.sleep(3)

try:
    from uwsgidecorators import postfork
    @postfork
    def init_pool_postfork():
        global shared_pool
        shared_pool = init_shared_pool()
    init_pool_postfork()
except ImportError:
    shared_pool = init_shared_pool()

# === SAFE CONNECTION GETTER WITH RETRY ===
def get_connection():
    for _ in range(10):  # Very patient retries
        try:
            conn = shared_pool.get_connection()
            if conn.is_connected():
                logger.debug("Connection acquired successfully")
                return conn
        except Error as e:
            logger.warning(f"Connection failed, retrying: {e}")
            time.sleep(3)
    logger.error("Failed to get DB connection after retries")
    return None

# === ADMIN CHECK ===
def is_admin():
    key = request.args.get('key') or request.headers.get('X-Telegram-User-ID')
    return key == "Hiptonic1@@"

# === REUSABLE QUERY HELPER ===
def query_db(database, query, params=None, dict_cursor=True):
    conn = get_connection()
    if not conn:
        return None
    try:
        # Explicitly select database (fixes "No database selected")
        cursor = conn.cursor()
        cursor.execute(f"USE {database}")
        cursor.close()

        cursor = conn.cursor(dictionary=dict_cursor)
        cursor.execute(query, params or ())
        results = cursor.fetchall()
        conn.commit()
        logger.debug(f"Query success in {database} - {len(results or [])} rows")
        return results
    except Error as e:
        logger.error(f"Query error in {database}: {e} | Query: {query} | Params: {params}")
        return None
    finally:
        try:
            cursor.close()
        except:
            pass
        try:
            conn.close()
        except:
            pass

@app.route('/')
def index():
    return jsonify({'message': 'API Running'})

@app.route('/users', methods=['GET'])
def get_users():
    if not is_admin():
        return jsonify({'error': 'Unauthorized'}), 401
    results = query_db('tcvkxete_userdb', """
        SELECT ud.id, ud.username, mr.unrestricted_at
        FROM user_details ud
        LEFT JOIN manual_restrictions mr ON ud.id = mr.user_id AND mr.chat_id = %s
    """, (-1002403282101,), dict_cursor=False)
    if results is None:
        return jsonify({'error': 'DB Error'}), 500
    user_list = [{'id': row[0], 'username': row[1] or f'User_{row[0]}', 'is_restricted': row[2] is None} for row in results]
    return jsonify({'users': user_list})

@app.route('/api/discord_messages')
def get_discord_messages():
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    search = request.args.get('search', '').lower()
    page = int(request.args.get('page', 1))
    per_page = 100
    offset = (page - 1) * per_page
    where = ""
    params = []
    if search:
        where = "WHERE content LIKE %s OR author_username LIKE %s"
        params.extend([f'%{search}%', f'%{search}%'])
    query = f"""
        SELECT created_at AS timestamp, 'Discord' AS platform, content,
               COALESCE(author_username, 'Unknown') AS author_username,
               COALESCE(channel_name, 'N/A') AS channel_name
        FROM tcvkxete_discord_members.messages
        {where}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """
    params.extend([per_page, offset])
    results = query_db('tcvkxete_discord_members', query, params)
    if results is None:
        return jsonify({'error': 'DB Error'}), 500
    for r in results:
        if r['timestamp']:
            r['timestamp'] = r['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
    return jsonify(results)

@app.route('/api/discord_deleted_messages')
def get_discord_deleted_messages():
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    search = request.args.get('search', '').lower()
    page = int(request.args.get('page', 1))
    per_page = 100
    offset = (page - 1) * per_page
    where = ""
    params = []
    if search:
        where = "WHERE content LIKE %s OR author_username LIKE %s OR reason LIKE %s"
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
    query = f"""
        SELECT timestamp, 'Discord' AS platform, content,
               COALESCE(author_username, 'Unknown') AS author_username,
               COALESCE(channel_name, 'N/A') AS channel_name, reason
        FROM tcvkxete_discord_members.deleted_messages
        {where}
        ORDER BY timestamp DESC
        LIMIT %s OFFSET %s
    """
    params.extend([per_page, offset])
    results = query_db('tcvkxete_discord_members', query, params)
    if results is None:
        return jsonify({'error': 'DB Error'}), 500
    for r in results:
        if r['timestamp']:
            r['timestamp'] = r['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
    return jsonify(results)

@app.route('/api/discord_user_details')
def get_discord_user_details():
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    search = request.args.get('search', '').lower()
    field = request.args.get('field', 'username')
    page = int(request.args.get('page', 1))
    per_page = 100
    offset = (page - 1) * per_page
    valid_fields = ['discord_id', 'username', 'discriminator', 'wallet_address']
    if field not in valid_fields:
        return jsonify({"error": "Invalid search field"}), 400
    where = "WHERE du.discord_id IS NOT NULL"
    params = []
    if search:
        if field == 'discord_id':
            where += " AND du.discord_id = %s"
            params.append(search)
        else:
            where += f" AND LOWER(du.{field}) LIKE %s"
            params.append(f'%{search}%')
    query = f"""
        SELECT du.id, du.discord_id, du.username, du.discriminator, du.joined_at, du.verified, du.verified_at, du.wallet_address,
               COUNT(m.message_id) AS message_count
        FROM tcvkxete_discord_members.discord_users du
        LEFT JOIN tcvkxete_discord_members.messages m ON du.discord_id = m.author_id
        {where}
        GROUP BY du.id, du.discord_id, du.username, du.discriminator, du.joined_at, du.verified, du.verified_at, du.wallet_address
        ORDER BY du.joined_at DESC
        LIMIT %s OFFSET %s
    """
    params.extend([per_page, offset])
    results = query_db('tcvkxete_discord_members', query, params)
    if results is None:
        return jsonify({'error': 'DB Error'}), 500
    return jsonify(results)

@app.route('/api/telegram_messages')
def get_telegram_messages():
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    search = request.args.get('search', '').lower()
    page = int(request.args.get('page', 1))
    per_page = 100
    offset = (page - 1) * per_page
    where = ""
    params = []
    if search:
        where = "WHERE m.content LIKE %s OR ud.username LIKE %s"
        params.extend([f'%{search}%', f'%{search}%'])
    query = f"""
        SELECT m.created_at AS timestamp, 'Telegram' AS platform, m.content,
               COALESCE(ud.username, CONCAT('User_', m.user_id)) AS username
        FROM tcvkxete_message_tracking.messages m
        LEFT JOIN tcvkxete_userdb.user_details ud ON m.user_id = ud.id
        {where}
        ORDER BY m.created_at DESC
        LIMIT %s OFFSET %s
    """
    params.extend([per_page, offset])
    results = query_db('tcvkxete_message_tracking', query, params)
    if results is None:
        return jsonify({'error': 'DB Error'}), 500
    for r in results:
        if r['timestamp']:
            r['timestamp'] = r['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
    return jsonify(results)
    
    

@app.route('/api/telegram_deleted_messages')
def get_telegram_deleted_messages():
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    search = request.args.get('search', '').lower()
    page = int(request.args.get('page', 1))
    per_page = 100
    offset = (page - 1) * per_page
    where = "WHERE platform = 'telegram'"
    params = []
    if search:
        where += " AND (content LIKE %s OR username LIKE %s OR reason LIKE %s OR chat_name LIKE %s)"
        like = f'%{search}%'
        params.extend([like, like, like, like])
    query = f"""
        SELECT message_id, chat_id, chat_name, user_id, username, content, timestamp, reason
        FROM tcvkxete_message_tracking.deleted_messages
        {where}
        ORDER BY timestamp DESC
        LIMIT %s OFFSET %s
    """
    params.extend([per_page, offset])
    results = query_db('tcvkxete_message_tracking', query, params)
    if results is None:
        return jsonify({'error': 'DB Error'}), 500
    for r in results:
        if r['timestamp']:
            r['timestamp'] = r['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
    return jsonify(results)

@app.route('/api/tester_logs', methods=['GET', 'POST'])
def tester_logs():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == 'POST':
        tester = request.args.get('tester')
        action = request.args.get('action')  # in, out, note, check_note
        notes = request.args.get('notes') or request.form.get('note') or ''
        item = request.args.get('item') or request.form.get('item') or ''  # for per-command notes

        if not tester or not action:
            return jsonify({"error": "Missing tester or action"}), 400

        # Append to tester-specific log file
        log_file = os.path.join(BASE_DIR, f"{tester}.log")
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        line = f"{timestamp} - {action.upper()} - {item} - {notes.strip()}\n"

        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(line)
            return jsonify({"status": "logged"})
        except Exception as e:
            logger.error(f"Write error: {e}")
            return jsonify({"error": str(e)}), 500

    # ── YOUR EXISTING GET LOGIC (UNCHANGED) ──
    search = request.args.get('search', '').lower()
    page = int(request.args.get('page', 1))
    per_page = 100
    offset = (page - 1) * per_page
    log_type = request.args.get('log', 'penna')

    log_files = {
        'penna': os.path.join(BASE_DIR, 'penna.log'),
        'chan': os.path.join(BASE_DIR, 'chan.log'),
        'tam': os.path.join(BASE_DIR, 'tam.log')
    }

    if log_type not in log_files:
        return jsonify({'error': 'Invalid log type'}), 400

    logs = []
    try:
        log_file = log_files[log_type]
        if os.path.exists(log_file):
            with open(log_file, 'r', encoding='utf-8', errors='replace') as f:
                lines = f.readlines()
                for line in lines:
                    if search and search not in line.lower():
                        continue
                    timestamp = datetime.now()
                    content = line.strip()
                    if ' - ' in line:
                        parts = line.split(' - ', 1)
                        ts_str = parts[0].strip()
                        for fmt in ['%Y-%m-%d %H:%M:%S,%f', '%m/%d/%Y, %I:%M:%S %p']:
                            try:
                                timestamp = datetime.strptime(ts_str, fmt)
                                break
                            except:
                                continue
                        content = parts[1].strip()
                    logs.append({
                        'timestamp': timestamp.isoformat(),
                        'log_file': f"{log_type}.log",
                        'content': content
                    })
        logs.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify(logs[offset:offset + per_page])
    except Exception as e:
        logger.error(f"Log error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/check_commands', methods=['GET'])
def check_commands():
    if not is_admin():
        logger.warning("Unauthorized access attempt to /api/check_commands")
        return jsonify({"error": "Unauthorized"}), 401
    log_type = request.args.get('log', 'penna')
    selected_date = request.args.get('date')
    commands = [
        '/COM', '/MT', '/TOKEN', '/TOPHOLDERS', '/FUTURET3CH', '/CA', '/TG', '/WHITEPAPER', '/WEBSITE', '/X', '/UPDATES', '/HELP', '/DEV',
        '/CHAT (INNOBOT)', '/BALANCE', '/PROFILE', '/SETWALLET', '/REWARDS', '/MC', '/MESSAGECOUNTS', '/POLL', '/REFER', '/FEEDBACK', '/BUGREPORT',
        '/PET', '/PETMARKET', '/GENGINE', '/GAMES', '/SILK', '/NWC', '/TAP', '/PACMAN', '/TETRISMOB', '/RACER', '/TETRIS', '/FRUITNINJA', '/DASH',
        '/myimages', '/Tally', '/Twitter', '/checkin', '/checkins'
    ]
    admin_commands = [
        '/GAD', '/PEAKSTATS', '/REFERRALREPORT', '/VIEWWALLET', '/VOICEALERT USER' , '/VOICEALERT GROUP', '/TOGGLERESTRICTIONS',
        '/UPDATEPOINTS', '/ADDFILTER', '/REMOVEFILTER', '/LISTFILTERS', '/USAGE', '/TOGGLE_CHAT_OFF', '/RESTRICT',
        '/UNRESTRICT', '/RESTRICTEDREPORT', '/VIEWMESSAGES'
    ]
    gad_features = [
        'ACTIVE USERS', 'ACTIVITY', 'BOTS', 'DISTRIBUTION', 'FEEDBACK', 'HOURLY PEAKS', 'INACTIVE', 'JOINS', 'MONTHLY',
        'PROFILE BACK TO GAD BUTTON ON PROFILE LOOKUP', 'PROFILE LOOKUP', 'REWARDS', 'SPAM DETECTION', 'TOKEN HOLDERS',
        'TOP CONTRIBUTERS', 'TOTALS', 'TRENDS', 'VERIFIED', 'WALLETS'
    ]
    pet_commands = [
        '/pet adopt', '/pet battle', '/pet breed', '/pet breedname', '/pet buy', '/pet feed',
        '/pet guildjoin', '/pet play', '/pet quest', '/pet release', '/pet status', '/pet trade',
        '/pet train', '/pet use', '/pet leagueadd',

        'BACK BUTTON', 'PROFILE',

        'GUILD CREATE', 'GUILD INFO', 'GUILD LEAVE', 'GUILD LIST', 'GUILD MANAGE',

        'LEADERBOARD', 'LEADERBOARD - DISPLAY FULL LIST',

        'LEAGUE - CAN YOU VIEW EACH LEAGUE?', 'LEAGUE CREATE', 'LEAGUE INFO',
        'LEAGUE JOIN', 'LEAGUE LEAVE', 'LEAGUE LIST',

        '/pet trade browse_target_pets',
        '/pet trade refresh_pet_list',
        '/pet trade previous_pet',
        '/pet trade next_pet',
        '/pet trade request_specific_pet',
        '/pet trade open_offer',
        '/pet trade accept_trade',
        '/pet trade reject_trade'
]

    listpets_commands = [
        '/listpets', '/listpets trade', '/listpets battle'
    ]
    petmarket_commands = [
        '/petmarket browse', '/petmarket buy', '/petmarket cancel', '/petmarket leaderboard', '/petmarket mylistings'
    ]
    ai_commands = [
        '/chat talk', '/chat tell me about', '/chat generate image', '/chat start trivia', '/chat drop a riddle', '/toggle_chat_off', '/myimages'
    ]
    viewwallets_features = [
        'Telegram Wallets', 'Discord Wallets'
    ]
    all_checks = {
        'Commands': commands,
        'Admin Commands': admin_commands,
        'GAD Features': gad_features,
        'Pet Commands': pet_commands,
        'List Pets': listpets_commands,
        'Petmarket Commands': petmarket_commands,
        'AI Commands': ai_commands,
        'View Wallets Features': viewwallets_features
    }

    executed = defaultdict(set)
    pattern = re.compile(r'(/\w+\s+\w+)|(/\w+)')
    log_path = os.path.join(BASE_DIR, log_type + '.log')
    if os.path.exists(log_path):
        with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
            for line in lines:
                try:
                    parts = line.split(' - ', 1)
                    if len(parts) < 2:
                        continue
                    timestamp_str = parts[0].strip()
                    timestamp = None
                    for fmt in ['%Y-%m-%d %H:%M:%S,%f', '%m/%d/%Y, %I:%M:%S %p']:
                        try:
                            timestamp = datetime.strptime(timestamp_str, fmt)
                            break
                        except ValueError:
                            continue
                    if not timestamp:
                        continue
                    if selected_date:
                        selected = datetime.strptime(selected_date, '%Y-%m-%d')
                        if timestamp.date() != selected.date():
                            continue
                    matches = pattern.findall(line.upper())
                    for match in matches:
                        cmd = match[0] if match[0] else match[1]
                        executed[cmd].add(log_path)
                except Exception as e:
                    logger.warning(f"Skipping invalid log line: {line.strip()} - Error: {e}")
                    continue
    checklist = {}
    for category, items in all_checks.items():
        checklist[category] = {}
        for item in items:
            upper_item = item.upper()
            base_cmd = upper_item.split()[0] if ' ' in upper_item else upper_item
            checklist[category][item] = '✅' if any(base_cmd in key for key in executed) else '❌'
    logger.debug(f"Command check completed for {log_type} with date filter {selected_date}: {checklist}")
    return jsonify(checklist)

@app.route('/api/user_details')
def get_user_details():
    if not is_admin(): return jsonify({"error": "Unauthorized"}), 401
    search = request.args.get('search', '').lower()
    field = request.args.get('field', 'username')
    page = int(request.args.get('page', 1))
    per_page = 100
    offset = (page - 1) * per_page
    valid_fields = ['id', 'first_name', 'last_name', 'username', 'phone', 'wallet_address']
    if field not in valid_fields:
        return jsonify({"error": "Invalid field"}), 400
    where = ""
    params = []
    if search:
        if field == 'id':
            try:
                params.append(int(search))
                where = "WHERE id = %s"
            except:
                return jsonify({"error": "Invalid ID"}), 400
        else:
            where = f"WHERE LOWER({field}) LIKE %s"
            params.append(f'%{search}%')
    query = f"SELECT id, first_name, last_name, username, phone, is_bot, message_count, verified, date, wallet_address FROM tcvkxete_userdb.user_details {where} ORDER BY date DESC LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    results = query_db('tcvkxete_userdb', query, params)
    if results is None:
        return jsonify({'error': 'DB Error'}), 500
    return jsonify(results)

# Paste your current /api/activity_stats here (or use the one from previous messages)
# Example minimal version that should work with the new SSL config:
@app.route('/api/activity_stats')
def activity_stats():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401

    platform = request.args.get('platform', 'discord').lower()
    hours = int(request.args.get('hours', 24))

    if platform == 'discord':
        db_name = 'tcvkxete_discord_members'
        query = f"""
            SELECT HOUR(created_at) AS hour,
                   COUNT(*) AS message_count
            FROM messages
            WHERE created_at >= NOW() - INTERVAL %s HOUR
            GROUP BY HOUR(created_at)
            ORDER BY HOUR(created_at)
        """
    else:
        db_name = 'tcvkxete_message_tracking'
        query = f"""
            SELECT hour,
                   SUM(message_count) AS message_count
            FROM hourly_message_counts
            WHERE date >= CURDATE() - INTERVAL %s DAY
            GROUP BY hour
            ORDER BY hour
        """
        hours = (hours // 24) + 1

    results = query_db(db_name, query, (hours,))
    if results is None:
        return jsonify({"error": "Database query failed"}), 500

    all_hours = {h: 0 for h in range(24)}
    for row in results or []:
        h = int(row['hour'])
        all_hours[h] = row['message_count']

    response = {
        "labels": [f"{h:02d}:00" for h in range(24)],
        "data": [all_hours[h] for h in range(24)],
        "platform": platform
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=False)
