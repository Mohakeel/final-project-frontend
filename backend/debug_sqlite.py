import os, sqlite3
path = os.path.abspath('instance/database.db')
print('abs', path)
print('parent exists', os.path.exists(os.path.dirname(path)))
print('listing', os.listdir(os.path.dirname(path)) if os.path.exists(os.path.dirname(path)) else 'no dir')
try:
    conn = sqlite3.connect(path)
    print('opened')
    conn.close()
except Exception as e:
    print('error', e)
