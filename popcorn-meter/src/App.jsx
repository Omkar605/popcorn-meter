import { useEffect, useRef, useState } from "react";
import "./App.css";
import StarRating from "./StarRating";
import { useMovies } from "./useMovies";
const App = () => {
  const [query, setQuery] = useState("int");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [watched, setWatched] = useState(() => {
    const saved = localStorage.getItem("watched");
    return saved ? JSON.parse(saved) : [];
  });
 
  const { movies, error, isLoading } = useMovies(query);
  const handleMovieClick = (movie) => {
    setSelectedMovieId(movie.imdbID);
  };
  const handleBackClick = () => {
    setSelectedMovieId(null);
  };
  const handleAdd = (movie) => {
    setWatched([...watched, movie]);
  };
  const handleDeleteWatched = (imdbID) => {
    setWatched(watched.filter((movie) => movie.imdbID !== imdbID));
  };
  useEffect(() => {
    localStorage.setItem("watched", JSON.stringify(watched));
  }, [watched]);
  return (
    <div className="App">
      <Navbar>
        {movies && <NumberResults movies={movies} />}
        <Search query={query} onSearch={setQuery} />
      </Navbar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList movies={movies} onMovieSelection={handleMovieClick} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedMovieId ? (
            <MovieDetails
              onHandleAdd={handleAdd}
              movieId={selectedMovieId}
              onClose={handleBackClick}
              watched={watched}
            />
          ) : (
            <>
              {" "}
              <MovieSummary watchedMovies={watched} />
              {watched.length > 0 && (
                <WatchedMovieList
                  watchedMovies={watched}
                  onHandleDelete={handleDeleteWatched}
                />
              )}
            </>
          )}
        </Box>
      </Main>
    </div>
  );
};
const Loader = () => {
  return (
    <div className="loader">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
};

const ErrorMessage = ({ message }) => {
  console.log(message);
  return (
    <div className="error">
      <p>{message}</p>
    </div>
  );
};
const Navbar = ({ children }) => {
  return (
    <div className="nav-bar">
      <Logo />
      {children}
    </div>
  );
};
const Logo = () => {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>PopcornMeter</h1>
    </div>
  );
};
const Search = ({ query, onSearch }) => {
  const inputRef = useRef();
  useEffect(() => {
    inputRef.current.focus();
  }, []);
  return (
    <input
      type="text"
      placeholder="Search movies..."
      className="search"
      value={query}
      onChange={(e) => onSearch(e.target.value)}
      ref={inputRef}
    />
  );
};
const NumberResults = ({ movies }) => {
  return (
    <div className="num-results">
      <p>Found {movies.length} results</p>
    </div>
  );
};
const Main = ({ children }) => {
  return <div className="main">{children}</div>;
};

const Box = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "-" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
};
const MovieList = ({ movies, onMovieSelection }) => {
  return (
    <ul className="list list-movies">
      {movies.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          onMovieSelection={onMovieSelection}
        />
      ))}
    </ul>
  );
};
const Movie = ({ movie, onMovieSelection }) => {
  return (
    <li
      onClick={() => {
        onMovieSelection(movie);
      }}
    >
      <img src={movie.Poster} alt={movie.Title} />
      <h3>{movie.Title}</h3>
      <div>
        <p>📅</p>
        <p>{movie.Year}</p>
      </div>
    </li>
  );
};
const MovieDetails = ({ movieId, onClose, onHandleAdd, watched }) => {
  const [movie, setMovie] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [yourRating, setYourRating] = useState(0);
  const isWatched = watched.map((movie) => movie.imdbID).includes(movieId);
  const WatchedUserRating = watched.find(
    (movie) => movie.imdbID === movieId
  )?.yourRating;
  
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === "Escape") {
        onClose();
        console.log("Escape key pressed");
      }
    }
    document.addEventListener("keydown", handleEscape);
    
      return () => { 
        document.removeEventListener("keydown", handleEscape);
      }
  }, [onClose]); 

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
  
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_API_KEY}&i=${movieId}`, 
          { signal }
        );
        const data = await response.json();
        setMovie(data);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted for movie details");
        } else {
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchMovieDetails();
  
    return () => {
      controller.abort();
      console.log("Cleanup: Aborted fetch for movie details");
    };
  }, [movieId]);  

  useEffect(() => {
    if(!movie.Title) return;
    document.title = `Movie | ${movie.Title}`;

    //cleanup function
    return () => { 
      document.title = "PopcornMeter";
      console.log("cleanup :" + movie.Title);
    };
  }, [movie]);

  const handleAddToList = () => {
    const newWatchedMovie = {
      imdbID: movieId,
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster,
      imdbRating: Number(movie.imdbRating),
      runtime: Number(movie.Runtime.split(" ")[0]),
      yourRating: yourRating,
    };
    onHandleAdd(newWatchedMovie);
    onClose();
  };
  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onClose}>
              &larr;
            </button>
            <img src={movie.Poster} alt={`Poster of ${movie.Title} movie`} />
            <div className="details-overview">
              <h1>{movie.Title}</h1>
              <p>
                {movie.Released} | {movie.Runtime} | {movie.Genre}
              </p>
              <p>{movie.Genre}</p>
              <p>
                <span>🌟</span>
                <span>{movie.imdbRating} IMDb rating</span>
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setYourRating}
                  />
                  {yourRating > 0 && (
                    <button className="btn-add" onClick={handleAddToList}>
                      + Add to list
                    </button>
                  )} 
                </>
              ) : (
                <p>
                  You Rated this movie {WatchedUserRating} <span>🌟</span>
                </p>
              )}
            </div>
            <p>
              <em>{movie.Plot}</em>
            </p>
            <p>Starring : {movie.Actors}</p>
            <p>Directed by: {movie.Director}</p>
          </section>
        </>
      )}
    </div>
  );
};

const WatchedMovieList = ({ watchedMovies, onHandleDelete }) => {
  return (
    <div className="list">
      <ul>
        {watchedMovies.map((movie) => (
          <WatchedMovie
            key={movie.imdbID}
            movie={movie}
            onHandleDelete={onHandleDelete}
          />
        ))}
      </ul>
    </div>
  );
};
const WatchedMovie = ({ movie, onHandleDelete }) => {
  return (
    <li>
      <img src={movie.poster} alt={movie.title} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.yourRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onHandleDelete(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
};
const MovieSummary = ({ watchedMovies }) => {
  const totalMovies = watchedMovies.length;
  const average = arr => arr.reduce((acc, val) => acc + val, 0) / arr.length;
  const avgImdbRating = average(watchedMovies.map((movie) => movie.imdbRating));
  const avgYourRating = average(watchedMovies.map((movie) => movie.yourRating));
  const avgRuntime = average(watchedMovies.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>MOVIES YOU WATCHED</h2>
      <div>
        <p>
          <span>🎞</span>
          <span>{totalMovies} movies</span>
        </p>
        <p>
          <span>⭐</span>
          <span>{totalMovies && avgImdbRating.toFixed(1)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{totalMovies && avgYourRating.toFixed(1)}</span>

        </p>
        <p>
          <span>{totalMovies && avgRuntime.toFixed(1)} min</span>
        </p>
      </div>
    </div>
  );
};
export default App;
