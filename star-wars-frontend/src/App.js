import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

function App() {
  const [films, setFilms] = useState([]);
  const [usernameRegister, setUsernameRegister] = useState("");
  const [passwordRegister, setPasswordRegister] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [registerError, setRegisterError] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [characterLoading, setCharacterLoading] = useState(false);
  const [successRegister, setSuccessRegister] = useState(null);

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      console.log("Decoded Token:", decodedToken);
      console.log("Current Time:", Date.now() / 1000);
      const decodedName = decodedToken.username;
      setUsername(decodedName);
      if (decodedToken.exp && decodedToken.exp > Date.now() / 1000) {
        fetchFilmData();

        const timeRemaining = (decodedToken.exp - Date.now() / 1000) * 1000;

        setTimeout(() => {
          setToken(null);
        }, timeRemaining);
      }
    }
  }, [token]);

  const fetchFilmData = async () => {
    try {
      setLoading(true);
      const filmsResponse = await axios.get("https://swapi.dev/api/films/");
      setLoading(false);
      setFilms(filmsResponse.data.results);
      setCharacterLoading(true);
      const filmsWithRandomCharacters = await Promise.all(
        filmsResponse.data.results.map(async (film) => {
          const uniqueRandomCharacters = [];
          while (uniqueRandomCharacters.length < 3) {
            const randomCharacterIndex = Math.floor(
              Math.random() * film.characters.length
            );
            const characterURL = film.characters[randomCharacterIndex];
            if (!uniqueRandomCharacters.includes(characterURL)) {
              uniqueRandomCharacters.push(characterURL);
            }
          }

          const randomCharacterPromises = uniqueRandomCharacters.map(
            async (characterURL) => {
              const characterResponse = await axios.get(characterURL);
              return characterResponse.data.name;
            }
          );

          const randomCharacters = await Promise.all(randomCharacterPromises);
          return { ...film, randomCharacters };
        })
      );
      setCharacterLoading(false);
      setFilms(filmsWithRandomCharacters);
    } catch (error) {
      console.error("Error fetching films:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post("http://localhost:3001/register", {
        username: usernameRegister,
        password: passwordRegister,
      });
      console.log(response);
      setSuccessRegister("User created!");
      setRegisterError(null);
    } catch (error) {
      console.log("Error during registration:", error);
      setRegisterError(error.response.data);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:3001/login", {
        username,
        password,
      });
      console.log(response);
      setToken(response.data.accessToken);
      setLoginError(null);
    } catch (error) {
      console.log("Error during login:", error);
      setLoginError(error.response.data);
    }
  };
  const handleLogout = () => {
    setToken(null);
  };

  return (
    <div>
      <h1>Star Wars Films</h1>

      {/* Registration Form */}
      <div>
        <h2>Register</h2>
        <input
          type="text"
          placeholder="UsernameRegister"
          value={usernameRegister}
          onChange={(e) => setUsernameRegister(e.target.value)}
        />
        <input
          type="password"
          placeholder="PasswordRegister"
          value={passwordRegister}
          onChange={(e) => setPasswordRegister(e.target.value)}
        />
        <button onClick={handleRegister}>Register</button>
      </div>
      {successRegister && <div>{successRegister}</div>}
      {registerError && <div>{registerError}</div>}

      {/* Login Form */}
      <div>
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
      {loginError && <div>{loginError}</div>}

      {/*Logged in user +  Logout Button */}

      {token && (
        <div>
          <h2>Logged in as {username}!</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {/* Display Please Login if token is null */}

      {!token && <h2>Please Login to see the movies</h2>}

      {/* Display Films only if logged in */}

      {token && (
        <>
          {loading ? (
            <h1>Loading Films...</h1>
          ) : (
            <>
              {films.map((film) => (
                <div key={film.title}>
                  <h2>{film.title}</h2>
                  {characterLoading ? (
                    <p>Loading Random Characters...</p>
                  ) : (
                    <>
                      <h3>Random Characters:</h3>
                      <ul>
                        {film.randomCharacters.map((characterName, index) => (
                          <li key={index}>{characterName}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
