import auth0 from 'auth0-js';
import Constants from 'config/constants';

const storageKey = 'auth-data';

export default class Auth {
  accessToken;

  idToken;

  expiresAt;

  auth0 = new auth0.WebAuth({
    domain: Constants.auth.DOMAIN,
    clientID: Constants.auth.CLIENT_ID,
    redirectUri: Constants.auth.CALLBACK_URL,
    responseType: 'token id_token',
    scope: 'openid',
  });

  login = () => {
    this.auth0.authorize();
  };

  handleAuthentication() {
    return new Promise((resolve, reject) => {
      this.auth0.parseHash((err, authResult) => {
        if (err) {
          reject(err);
        } else {
          if (authResult && authResult.accessToken && authResult.idToken) {
            this.setSession(authResult);
          }
          resolve();
        }
      });
    });
  }

  getAccessToken() {
    return this.accessToken;
  }

  getIdToken() {
    return this.idToken;
  }

  setSession(authResult) {
    const expiresAt = authResult.expiresIn * 1000 + new Date().getTime();

    // Set isLoggedIn flag in localStorage
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        accessToken: authResult.accessToken,
        idToken: authResult.idToken,
        expiresAt,
      }),
    );

    // Set the time that the access token will expire at
    this.accessToken = authResult.accessToken;
    this.idToken = authResult.idToken;
    this.expiresAt = expiresAt;
  }

  loadSession() {
    const json = localStorage.getItem(storageKey);

    if (json) {
      const session = JSON.parse(json);

      this.accessToken = session.accessToken;
      this.idToken = session.idToken;
      this.expiresAt = session.expiresAt;
    }
  }

  renewSession() {
    this.auth0.checkSession({}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
      } else if (err) {
        this.logout();
        console.log(err);
      }
    });
  }

  logout = () => {
    // Remove tokens and expiry time from memory
    this.accessToken = null;
    this.idToken = null;
    this.expiresAt = 0;

    // Remove token from localStorage
    localStorage.removeItem(storageKey);
  };

  isAuthenticated() {
    // Check whether the current time is past the
    // access token's expiry time
    let expiresAt = this.expiresAt;
    return new Date().getTime() < expiresAt;
  }
}
