import subprocess
import re
import time

subprocess.run(["pkill", "-9", "cloudflared"])
time.sleep(0.5)

proc = subprocess.Popen(
    [
        "/tmp/cloudflared",
        "tunnel",
        "--protocol",
        "http2",
        "--url",
        "http://127.0.0.1:3000",
        "--http-host-header",
        "localhost"
    ],
    stderr=subprocess.PIPE,
    stdout=subprocess.PIPE,
    text=True
)

url = None
while True:
    line = proc.stderr.readline()
    if not line:
        break
    print(line.strip())
    match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
    if match:
        url = match.group(0)
        print(">>> ACTIVE_PUBLIC_TUNNEL_URL=" + url)
        with open("/tmp/active_tunnel_url.txt", "w") as f:
            f.write(url)
        # Keep process running in background
