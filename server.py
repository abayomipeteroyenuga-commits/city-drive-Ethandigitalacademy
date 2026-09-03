import http.server, socketserver, os
ROOT=os.path.dirname(os.path.abspath(__file__))
for marker in ('server-ready.txt','server-error.txt'):
    try: os.remove(os.path.join(ROOT, marker))
    except OSError: pass
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=ROOT,**kw)
    def log_message(self,*a): pass
for port in range(8765,8796):
    try:
        httpd=socketserver.TCPServer(('127.0.0.1',port),Handler)
        break
    except OSError:
        httpd=None
if httpd is None: raise SystemExit('No available local port found (tried 8765-8795).')
with open(os.path.join(ROOT,'server-ready.txt'),'w',encoding='ascii') as f: f.write(f'READY http://127.0.0.1:{port}/')
try: httpd.serve_forever()
finally: httpd.server_close()
