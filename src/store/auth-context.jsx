import React, { useState } from "react";

let logoutTimer;

const AuthContext = React.createContext({
  token: "",
  isLoggedIn: false,
  login: (token) => {},
  logout: () => {},
});

function calculateTime(expirationTime) {
  //gets current time in milliseconds, and expiration time of token in ms
  const currentTime = new Date().getTime();
  const adjExpirationTime = new Date(expirationTime).getTime();
  //subtracts two to make sure token is still valid
  const remaingDuration = adjExpirationTime - currentTime;
  return remaingDuration;
}

function retrieveStoredToken() {
  //gets token data from local storage and checks to see if token is near expiration
  const storedToken = localStorage.getItem("token");
  const storedExpirationDate = localStorage.getItem("expirationTime");
  const remainingTime = calculateTime(storedExpirationDate);
  if (remainingTime <= 60000) {
    localStorage.removeItem("token");
    localStorage.removeItem("expirationTime");
    return null;
  }
  //only return data if token not about to expire
  return {
    token: storedToken,
    duration: remainingTime,
  };
}

export function AuthContextProvider({ children }) {
  //useEffect not needed here as local storage is a synchronous API, works the same
  const tokenData = retrieveStoredToken();
  let initialToken;
  if (tokenData) {
    initialToken = tokenData.token;
    logoutTimer = setTimeout(logoutHandler, tokenData.duration);
    console.log(tokenData.duration);
  }
  const [token, setToken] = useState(initialToken);
  //!! converts truthy value to truthy boolean value
  const userIsLoggedIn = !!token;

  function logoutHandler() {
    setToken(null);
    localStorage.removeItem("token");
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }
  }

  function loginHandler(token, expiration) {
    setToken(token);
    localStorage.setItem("token", token);
    localStorage.setItem("expirationTime", expiration);
    //pass expiry time from firebase to get time in ms until token expires
    const remainingTime = calculateTime(expiration);
    //sets timer to auto logout when token expires
    logoutTimer = setTimeout(logoutHandler, remainingTime);
  }

  const contextValue = {
    token: token,
    isLoggedIn: userIsLoggedIn,
    login: loginHandler,
    logout: logoutHandler,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export default AuthContext;
