import msal
import requests
from flask import Flask, redirect, url_for, session, request, jsonify

app = Flask(__name__)
app.secret_key = "SECRET_KEY_FOR_SESSION"  # Change this in production

# --- CONFIGURATION (Paste your Azure details here) ---
CLIENT_ID = "SET CLIENT ID HERE"
CLIENT_SECRET = "SET CLIENT SECRET HERE"
TENANT_ID = "common"  # Use 'common' for multi-tenant or your KFUPM tenant ID
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
REDIRECT_PATH = "/getAToken"


# -----------------------------------------------------

@app.route("/")
def index():
    if not session.get("user"):
        return '<h1>KFUPM SSO Demo</h1><a href="/login"><button>Sign In with Microsoft</button></a>'
    return f'<h1>Welcome, {session["user"]["name"]}</h1><pre>{session["user_data_json"]}</pre><a href="/logout">Logout</a>'


@app.route("/login")
def login():
    # 1. Initialize MSAL Confidential Client
    client = msal.ConfidentialClientApplication(CLIENT_ID, authority=AUTHORITY, client_credential=CLIENT_SECRET)

    # 2. Build the Auth URL
    auth_url = client.get_authorization_request_url(
        scopes=["User.Read"],
        redirect_uri=url_for("authorized", _external=True)
    )
    return redirect(auth_url)


@app.route(REDIRECT_PATH)
def authorized():
    # 1. Initialize MSAL client
    client = msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        client_credential=CLIENT_SECRET
    )

    # 2. Exchange the authorization code for a token
    if 'code' not in request.args:
        return "Error: No authorization code received.", 400

    result = client.acquire_token_by_authorization_code(
        request.args['code'],
        scopes=["User.Read"],
        redirect_uri=url_for("authorized", _external=True)
    )

    if "error" in result:
        return f"Login failed: {result.get('error_description')}", 401

    # 3. Pull data from Microsoft Graph
    access_token = result.get("access_token")
    user_data = requests.get(
        'https://graph.microsoft.com/v1.0/me',
        headers={'Authorization': f'Bearer {access_token}'},
        timeout=10
    ).json()

    # --- SECURITY FILTER: Only allow KFUPM emails ---
    email = user_data.get("userPrincipalName", "").lower()

    if not email.endswith("@kfupm.edu.sa"):
        # Log out the user immediately if they aren't from KFUPM
        session.clear()
        return "<h1>Access Denied</h1><p>This application is restricted to KFUPM students and staff only.</p><a href='/'>Go Back</a>", 403

    # 4. Success! Store user in session
    session["user"] = {
        "name": user_data.get("displayName"),
        "email": email,
        "id": user_data.get("id")  # Unique ID for your database
    }

    # Store the raw JSON just for your demo "confirm info" view
    session["user_data_json"] = user_data

    return redirect(url_for("index"))

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

REDIRECT_PATH = "/getAToken"
if __name__ == "__main__":
    app.run(host='localhost', port=5001, debug=True)