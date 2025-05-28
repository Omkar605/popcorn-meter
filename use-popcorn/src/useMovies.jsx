import {useEffect, useState} from 'react';
const API_KEY = "4d89307f";
export const useMovies = query => {
  const [movies, setMovies] = useState ([]);
  const [error, setError] = useState (null);
  const [isLoading, setIsLoading] = useState (false);
  useEffect (
    () => {
      const controller = new AbortController (); // Create AbortController instance
      const signal = controller.signal;
      const debounceTimeout = setTimeout (() => {
        const fetchMovies = async () => {
          try {
            setIsLoading (true);
            setError (null);
            const response = await fetch (
              `http://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`,
              {signal}
            );
            if (!response.ok) throw new Error ('Something went wrong');
            const data = await response.json ();
            if (data.Response === 'False') throw new Error ('Movie not found');
            setMovies (data.Search || []);
          } catch (error) {
            if (error.name !== 'AbortError') {
              setError (error.message);
            }
          } finally {
            setIsLoading (false);
          }
        };
        fetchMovies ();
      }, 500); // 500ms debounce delay

      return () => {
        clearTimeout (debounceTimeout); // Clear the debounce timer
        controller.abort (); // Abort any ongoing fetch request
      };
    },
    [query]
  );
  return {movies, error, isLoading};
};
