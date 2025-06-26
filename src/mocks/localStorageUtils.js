const PLACEHOLDER_CREDENTIALS = "entretien";

export function setItem(localstorageKey, state) {
  const login = PLACEHOLDER_CREDENTIALS;
  if (!login) {
    return;
  }
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(login + "_" + localstorageKey, serializedState);
  } catch (err) {
    console.warn(err);
  }
}

// Set the state from localstorage
export function getItem(localstorageKey, userName = null) {
  try {
    const userNameLogin = userName || PLACEHOLDER_CREDENTIALS;
    const serializedState = localStorage.getItem(
      userNameLogin + "_" + localstorageKey,
    );
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
}
