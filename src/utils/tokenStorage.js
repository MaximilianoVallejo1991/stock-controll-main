// Session token: sessionStorage (tab-scoped, survives hard refresh, dies with the tab).
// Sudo token: memory only (module-level `let`) — never persisted, lost on refresh by design.
const SESSION_TOKEN_KEY = 'auth-token';

let sudoToken = null;

export const getToken = () => sessionStorage.getItem(SESSION_TOKEN_KEY);
export const setToken = (token) => sessionStorage.setItem(SESSION_TOKEN_KEY, token);

export const getSudoToken = () => sudoToken;
export const setSudoToken = (token) => { sudoToken = token; };

export const clearTokens = () => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sudoToken = null;
};
