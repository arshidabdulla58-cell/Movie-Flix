/* ============================================================
   MOVIEFLIX
   COMPLETE SCRIPT.JS

   Features:
   - TMDB API
   - Home sections
   - Search
   - Movie details
   - Trailer
   - Favorites
   - Already Watched
   - To Be Watched
   - Account registration
   - Account login
   - Profile editing
   - Reviews CRUD
   - Watchlist CRUD
   - LocalStorage persistence
============================================================ */


/* ============================================================
   1. TMDB CONFIGURATION
============================================================ */

/*
   IMPORTANT:
   Replace the value below with your NEW TMDB API key.

   Do NOT use the old API key you posted in chat.
*/

const TMDB_API_KEY = "686025cbe0ca0165a1059efee08a15f1";

const TMDB_BASE_URL =
    "https://api.themoviedb.org/3";

const TMDB_IMAGE_URL =
    "https://image.tmdb.org/t/p/w500";

const TMDB_BACKDROP_URL =
    "https://image.tmdb.org/t/p/original";


/* ============================================================
   2. APPLICATION STATE
============================================================ */

const state = {

    currentPage: "home",

    moviesPage: 1,

    currentMovie: null,

    currentTrailerKey: null,

    currentWatchStatus: "favorite",

    currentReviewRating: 0,

    currentUser: null,

    searchTimeout: null,

    heroMovie: null

};


/* ============================================================
   3. LOCAL STORAGE KEYS
============================================================ */

const STORAGE_KEYS = {

    users: "movieflix_users",

    currentUser: "movieflix_current_user",

    collections: "movieflix_collections",

    reviews: "movieflix_reviews"

};


/* ============================================================
   4. BASIC HELPERS
============================================================ */

function getElement(id) {

    return document.getElementById(id);

}


function safeJSONParse(value, fallback) {

    try {

        return value
            ? JSON.parse(value)
            : fallback;

    } catch (error) {

        console.error(
            "JSON parse error:",
            error
        );

        return fallback;

    }

}


function getUsers() {

    return safeJSONParse(
        localStorage.getItem(
            STORAGE_KEYS.users
        ),
        []
    );

}


function saveUsers(users) {

    localStorage.setItem(
        STORAGE_KEYS.users,
        JSON.stringify(users)
    );

}


function getCollections() {

    return safeJSONParse(
        localStorage.getItem(
            STORAGE_KEYS.collections
        ),
        {}
    );

}


function saveCollections(collections) {

    localStorage.setItem(
        STORAGE_KEYS.collections,
        JSON.stringify(collections)
    );

}


function getReviews() {

    return safeJSONParse(
        localStorage.getItem(
            STORAGE_KEYS.reviews
        ),
        {}
    );

}


function saveReviews(reviews) {

    localStorage.setItem(
        STORAGE_KEYS.reviews,
        JSON.stringify(reviews)
    );

}


/* ============================================================
   5. CURRENT USER
============================================================ */

function loadCurrentUser() {

    const email =
        localStorage.getItem(
            STORAGE_KEYS.currentUser
        );

    if (!email) {

        state.currentUser = null;

        return;

    }


    const users = getUsers();

    const user =
        users.find(
            item =>
                item.email === email
        );


    state.currentUser = user || null;

}


function saveCurrentUser() {

    if (state.currentUser) {

        localStorage.setItem(
            STORAGE_KEYS.currentUser,
            state.currentUser.email
        );

    } else {

        localStorage.removeItem(
            STORAGE_KEYS.currentUser
        );

    }

}


/* ============================================================
   6. USER COLLECTION
============================================================ */

function getUserCollection() {

    if (!state.currentUser) {

        return {

            favorite: [],

            watched: [],

            towatch: []

        };

    }


    const collections =
        getCollections();


    if (!collections[state.currentUser.email]) {

        collections[state.currentUser.email] = {

            favorite: [],

            watched: [],

            towatch: []

        };

        saveCollections(collections);

    }


    return collections[
        state.currentUser.email
    ];

}


function saveUserCollection(collection) {

    if (!state.currentUser) {

        return;

    }


    const collections =
        getCollections();


    collections[
        state.currentUser.email
    ] = collection;


    saveCollections(collections);

}


/* ============================================================
   7. MOVIE ID HELPERS
============================================================ */

function movieIsInCollection(
    movieId,
    status
) {

    const collection =
        getUserCollection();


    return collection[
        status
    ].some(
        movie =>
            Number(movie.id) ===
            Number(movieId)
    );

}


function getMovieStatus(movieId) {

    const collection =
        getUserCollection();


    if (
        collection.favorite.some(
            movie =>
                Number(movie.id) ===
                Number(movieId)
        )
    ) {

        return "favorite";

    }


    if (
        collection.watched.some(
            movie =>
                Number(movie.id) ===
                Number(movieId)
        )
    ) {

        return "watched";

    }


    if (
        collection.towatch.some(
            movie =>
                Number(movie.id) ===
                Number(movieId)
        )
    ) {

        return "towatch";

    }


    return null;

}


/* ============================================================
   8. ADD MOVIE TO COLLECTION
============================================================ */

/* ============================================================
   8. ADD MOVIE TO COLLECTION
============================================================ */

function addMovieToCollection(
    movie,
    status
) {

    if (!state.currentUser) {

        showToast(
            "Please sign in first."
        );

        openAccountModal();

        return false;

    }


    const collection =
        getUserCollection();


    /*
       IMPORTANT:
       Each collection is completely independent.

       A movie can now exist in:
       ❤️ favorite
       ✅ watched
       ⏰ towatch

       at the same time.

       We ONLY add the movie to the selected
       collection and DO NOT remove it from
       the other collections.
    */


    if (
        !collection[status]
    ) {

        collection[status] = [];

    }


    const alreadyExists =
        collection[status].some(
            item =>
                Number(item.id) ===
                Number(movie.id)
        );


    if (!alreadyExists) {

        collection[status].push(
            cleanMovieForStorage(movie)
        );

    }


    saveUserCollection(
        collection
    );


    updateWatchlistCounts();


    return true;

}



/* ============================================================
   9. REMOVE MOVIE FROM COLLECTION
============================================================ */

function removeMovieFromCollection(
    movieId,
    status
) {

    if (!state.currentUser) {

        return;

    }


    const collection =
        getUserCollection();


    collection[
        status
    ] =
        collection[
            status
        ].filter(
            movie =>
                Number(movie.id) !==
                Number(movieId)
        );


    saveUserCollection(
        collection
    );


    updateWatchlistCounts();

}


/* ============================================================
   10. CLEAN MOVIE OBJECT
============================================================ */

function cleanMovieForStorage(movie) {

    return {

        id: movie.id,

        title:
            movie.title ||
            movie.name ||
            "Unknown Movie",

        poster_path:
            movie.poster_path ||
            null,

        backdrop_path:
            movie.backdrop_path ||
            null,

        overview:
            movie.overview ||
            "",

        release_date:
            movie.release_date ||
            movie.first_air_date ||
            "",

        vote_average:
            Number(
                movie.vote_average || 0
            ),

        genre_ids:
            Array.isArray(
                movie.genre_ids
            )
                ? movie.genre_ids
                : [],

        genres:
            Array.isArray(movie.genres)
                ? movie.genres
                : []

    };

}


/* ============================================================
   11. TMDB API REQUEST
============================================================ */

async function tmdbFetch(
    endpoint,
    params = {}
) {

    if (
        !TMDB_API_KEY ||
        TMDB_API_KEY ===
            "YOUR_NEW_TMDB_API_KEY"
    ) {

        throw new Error(
            "Please add your new TMDB API key in script.js."
        );

    }


    const query =
        new URLSearchParams({

            api_key:
                TMDB_API_KEY,

            language:
                "en-US",

            ...params

        });


    const url =
        `${TMDB_BASE_URL}${endpoint}?${query}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        let message =
            `TMDB request failed (${response.status})`;


        try {

            const errorData =
                await response.json();


            if (errorData.status_message) {

                message =
                    errorData.status_message;

            }

        } catch (error) {

            // Ignore JSON parsing error.

        }


        throw new Error(message);

    }


    return response.json();

}


/* ============================================================
   12. IMAGE URL
============================================================ */

function getPosterUrl(
    posterPath
) {

    if (!posterPath) {

        return "";

    }


    if (
        posterPath.startsWith("http")
    ) {

        return posterPath;

    }


    return (
        TMDB_IMAGE_URL +
        posterPath
    );

}


/* ============================================================
   13. ESCAPE HTML
============================================================ */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ============================================================
   14. FORMAT DATE
============================================================ */

function formatDate(dateString) {

    if (!dateString) {

        return "Unknown";

    }


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown";

    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* ============================================================
   15. GET YEAR
============================================================ */

function getMovieYear(movie) {

    const date =
        movie.release_date ||
        movie.first_air_date;


    return date
        ? date.substring(0, 4)
        : "N/A";

}


/* ============================================================
   16. SHOW TOAST
============================================================ */

let toastTimer = null;


function showToast(message) {

    const toast =
        getElement("toast");


    const messageElement =
        getElement("toastMessage");


    if (!toast || !messageElement) {

        return;

    }


    messageElement.textContent =
        message;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2800
        );

}


/* ============================================================
   17. LOADING SCREEN
============================================================ */

function hideLoadingScreen() {

    const loading =
        getElement("loadingScreen");


    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }

}


/* ============================================================
   18. INITIALIZE APPLICATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


async function initializeApp() {

    loadCurrentUser();

    setupNavigation();

    setupSearch();

    setupMovieModal();

    setupAccountModal();

    setupWatchlist();

    setupPagination();

    setupFilters();

    setupHeroButtons();

    setupMobileMenu();

    updateAccountUI();

    updateWatchlistCounts();


    await loadHomePage();


    hideLoadingScreen();

}


/* ============================================================
   19. NAVIGATION
============================================================ */

function setupNavigation() {

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            button.dataset.page;


                        navigateTo(
                            page
                        );


                        getElement(
                            "mobileMenu"
                        )?.classList.remove(
                            "active"
                        );

                    }
                );

            }
        );


    getElement(
        "logoButton"
    )?.addEventListener(
        "click",
        () => {

            navigateTo("home");

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    getElement(
        "browseMoviesButton"
    )?.addEventListener(
        "click",
        () => {

            navigateTo("movies");

        }
    );

}


/* ============================================================
   20. NAVIGATE
============================================================ */

async function navigateTo(page) {

    state.currentPage =
        page;


    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            section => {

                section.classList.remove(
                    "active-page"
                );

            }
        );


    const target =
        getElement(
            `${page}Page`
        );


    if (target) {

        target.classList.add(
            "active-page"
        );

    }


    document
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.page ===
                        page
                );

            }
        );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (
        page === "movies" &&
        !state.moviesLoaded
    ) {

        await loadMoviesPage();

    }


    if (page === "watchlist") {

        renderWatchlist();

    }

}


/* ============================================================
   21. MOBILE MENU
============================================================ */

function setupMobileMenu() {

    const button =
        getElement(
            "mobileMenuButton"
        );


    const menu =
        getElement(
            "mobileMenu"
        );


    button?.addEventListener(
        "click",
        () => {

            menu?.classList.toggle(
                "active"
            );

        }
    );


    getElement(
        "mobileAccountButton"
    )?.addEventListener(
        "click",
        () => {

            menu?.classList.remove(
                "active"
            );

            openAccountModal();

        }
    );

}


/* ============================================================
   22. HOME PAGE
============================================================ */

async function loadHomePage() {

    try {

        const results =
            await Promise.allSettled([

                loadTrending(),

                loadPopular(),

                loadTopRated(),

                loadGenreMovies(
                    "actionMovies",
                    28
                ),

                loadGenreMovies(
                    "comedyMovies",
                    35
                ),

                loadGenreMovies(
                    "horrorMovies",
                    27
                ),

                loadGenreMovies(
                    "scifiMovies",
                    878
                )

            ]);


        const successful =
            results.filter(
                result =>
                    result.status ===
                    "fulfilled"
            );


        if (
            successful.length === 0
        ) {

            showToast(
                "Unable to load movies. Check your TMDB API key."
            );

        }

    } catch (error) {

        console.error(
            "Home page error:",
            error
        );

        showToast(
            "Unable to load movies."
        );

    }

}


/* ============================================================
   23. TRENDING
============================================================ */

async function loadTrending() {

    const data =
        await tmdbFetch(
            "/trending/movie/week"
        );


    const movies =
        data.results || [];


    renderMovieRow(
        "trendingMovies",
        movies.slice(0, 10)
    );


    if (movies.length > 0) {

        state.heroMovie =
            movies[0];

        updateHero(
            movies[0]
        );

    }

}


/* ============================================================
   24. POPULAR
============================================================ */

async function loadPopular() {

    const data =
        await tmdbFetch(
            "/movie/popular",
            {
                page: 1
            }
        );


    renderMovieRow(
        "popularMovies",
        data.results?.slice(
            0,
            10
        ) || []
    );

}


/* ============================================================
   25. TOP RATED
============================================================ */

async function loadTopRated() {

    const data =
        await tmdbFetch(
            "/movie/top_rated",
            {
                page: 1
            }
        );


    renderMovieRow(
        "topRatedMovies",
        data.results?.slice(
            0,
            10
        ) || []
    );

}


/* ============================================================
   26. GENRE MOVIES
============================================================ */

async function loadGenreMovies(
    containerId,
    genreId
) {

    const data =
        await tmdbFetch(
            "/discover/movie",
            {

                with_genres:
                    genreId,

                sort_by:
                    "popularity.desc",

                page: 1

            }
        );


    renderMovieRow(
        containerId,
        data.results?.slice(
            0,
            10
        ) || []
    );

}


/* ============================================================
   27. RENDER MOVIE ROW
============================================================ */

function renderMovieRow(
    containerId,
    movies
) {

    const container =
        getElement(
            containerId
        );


    if (!container) {

        return;

    }


    if (!movies.length) {

        container.innerHTML =
            `<p class="loading-message">
                No movies found.
             </p>`;

        return;

    }


    container.innerHTML =
        movies
            .map(
                movie =>
                    createMovieCard(
                        movie
                    )
            )
            .join("");


    attachMovieCardEvents(
        container
    );

}


/* ============================================================
   28. MOVIE CARD HTML
============================================================ */

function createMovieCard(
    movie
) {

    const title =
        movie.title ||
        movie.name ||
        "Unknown Movie";


    const year =
        getMovieYear(
            movie
        );


    const rating =
        Number(
            movie.vote_average || 0
        ).toFixed(1);


    const poster =
        getPosterUrl(
            movie.poster_path
        );


    const status =
        getMovieStatus(
            movie.id
        );


    const favoriteBadge =
        status === "favorite"
            ? `
                <span
                    class="movie-badge favorite"
                >
                    <i class="fa-solid fa-heart"></i>
                </span>
              `
            : "";


    const imageHTML =
        poster
            ? `
                <img
                    src="${poster}"
                    alt="${escapeHTML(title)}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
              `
            : `
                <div
                    style="
                        width:100%;
                        height:100%;
                        display:grid;
                        place-items:center;
                        color:#777;
                        background:#222;
                    "
                >
                    <i
                        class="fa-solid fa-film"
                        style="font-size:30px;"
                    ></i>
                </div>
              `;


    return `

        <article
            class="movie-card"
            data-movie-id="${movie.id}"
        >

            <div class="movie-poster">

                ${imageHTML}


                <div class="movie-card-badges">

                    ${favoriteBadge}

                </div>


                <div class="movie-overlay">

                    <button
                        class="movie-info-button"
                        type="button"
                        data-info-id="${movie.id}"
                    >

                        <i
                            class="fa-solid fa-circle-info"
                        ></i>

                        More Info

                    </button>

                </div>

            </div>


            <div class="movie-card-body">

                <div
                    class="movie-title"
                    title="${escapeHTML(title)}"
                >
                    ${escapeHTML(title)}
                </div>


                <div class="movie-meta">

                    <span>
                        ${year}
                    </span>


                    <span class="movie-rating">

                        <i
                            class="fa-solid fa-star"
                        ></i>

                        ${rating}

                    </span>

                </div>

            </div>

        </article>

    `;

}


/* ============================================================
   29. ATTACH CARD EVENTS
============================================================ */

function attachMovieCardEvents(
    container
) {

    container
        .querySelectorAll(
            ".movie-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                ".movie-info-button"
                            )
                        ) {

                            return;

                        }


                        const id =
                            card.dataset.movieId;


                        openMovieDetails(
                            id
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".movie-info-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        openMovieDetails(
                            button.dataset.infoId
                        );

                    }
                );

            }
        );

}


/* ============================================================
   30. MOVIE DETAILS
============================================================ */

async function openMovieDetails(
    movieId
) {

    const modal =
        getElement(
            "movieModal"
        );


    const details =
        getElement(
            "movieDetails"
        );


    if (!modal || !details) {

        return;

    }


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";


    details.innerHTML = `

        <div class="loading-message">

            <div class="loader"></div>

            <p>
                Loading movie details...
            </p>

        </div>

    `;


    try {

        const movie =
            await tmdbFetch(
                `/movie/${movieId}`,
                {
                    append_to_response:
                        "videos"
                }
            );


        state.currentMovie =
            movie;


        const trailer =
            findTrailer(
                movie.videos?.results || []
            );


        state.currentTrailerKey =
            trailer?.key || null;


        renderMovieDetails(
            movie,
            trailer
        );


    } catch (error) {

        console.error(
            "Movie details error:",
            error
        );


        details.innerHTML = `

            <div class="loading-message">

                <i
                    class="fa-solid fa-triangle-exclamation"
                    style="font-size:35px;color:#e50914;"
                ></i>

                <p>
                    Unable to load movie information.
                </p>

                <button
                    class="secondary-button"
                    type="button"
                    onclick="closeMovieModal()"
                >
                    Close
                </button>

            </div>

        `;

    }

}


/* ============================================================
   31. FIND TRAILER
============================================================ */

function findTrailer(
    videos
) {

    if (!Array.isArray(videos)) {

        return null;

    }


    return (
        videos.find(
            video =>
                video.site === "YouTube" &&
                video.type === "Trailer" &&
                video.official === true
        ) ||

        videos.find(
            video =>
                video.site === "YouTube" &&
                video.type === "Trailer"
        ) ||

        videos.find(
            video =>
                video.site === "YouTube"
        ) ||

        null
    );

}


/* ============================================================
   32. RENDER MOVIE DETAILS
============================================================ */

function renderMovieDetails(
    movie,
    trailer
) {

    const details =
        getElement(
            "movieDetails"
        );


    const title =
        movie.title ||
        movie.name ||
        "Unknown Movie";


    const poster =
        getPosterUrl(
            movie.poster_path
        );


    const rating =
        Number(
            movie.vote_average || 0
        ).toFixed(1);


    const runtime =
        movie.runtime
            ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
            : "N/A";


    const genres =
        movie.genres || [];


    const favorite =
        movieIsInCollection(
            movie.id,
            "favorite"
        );


    const watched =
        movieIsInCollection(
            movie.id,
            "watched"
        );


    const towatch =
        movieIsInCollection(
            movie.id,
            "towatch"
        );


    details.innerHTML = `

        <div class="movie-details-top">

            <img
                class="details-poster"
                src="${poster}"
                alt="${escapeHTML(title)}"
                onerror="this.style.display='none'"
            >


            <div class="details-content">

                <h2>
                    ${escapeHTML(title)}
                </h2>


                <div class="details-meta">

                    <span>
                        ${getMovieYear(movie)}
                    </span>

                    <span>•</span>

                    <span>
                        ${runtime}
                    </span>

                    <span>•</span>

                    <span class="details-rating">

                        <i
                            class="fa-solid fa-star"
                        ></i>

                        ${rating}

                    </span>

                </div>


                <div class="genre-list">

                    ${genres
                        .map(
                            genre =>
                                `
                                <span
                                    class="genre-tag"
                                >
                                    ${escapeHTML(
                                        genre.name
                                    )}
                                </span>
                                `
                        )
                        .join("")}

                </div>


                <p class="details-overview">

                    ${
                        escapeHTML(
                            movie.overview ||
                            "No description available."
                        )
                    }

                </p>


                <div class="details-actions">

                    <button
                        class="details-action ${
                            favorite
                                ? "active"
                                : ""
                        }"
                        type="button"
                        id="detailFavoriteButton"
                    >

                        <i
                            class="fa-solid fa-heart"
                        ></i>

                        ${
                            favorite
                                ? "Favorited"
                                : "Favorite"
                        }

                    </button>


                    <button
                        class="details-action ${
                            watched
                                ? "active"
                                : ""
                        }"
                        type="button"
                        id="detailWatchedButton"
                    >

                        <i
                            class="fa-solid fa-circle-check"
                        ></i>

                        ${
                            watched
                                ? "Watched"
                                : "Already Watched"
                        }

                    </button>


                    <button
                        class="details-action ${
                            towatch
                                ? "active"
                                : ""
                        }"
                        type="button"
                        id="detailTowatchButton"
                    >

                        <i
                            class="fa-solid fa-clock"
                        ></i>

                        ${
                            towatch
                                ? "In To Watch"
                                : "To Be Watched"
                        }

                    </button>

                </div>

            </div>

        </div>


        ${
            trailer
                ? `

                    <div class="trailer-section">

                        <h3>
                            Trailer
                        </h3>


                        <iframe
                            class="trailer-frame"
                            src="https://www.youtube.com/embed/${trailer.key}"
                            title="${escapeHTML(title)} trailer"
                            allow="
                                accelerometer;
                                autoplay;
                                clipboard-write;
                                encrypted-media;
                                gyroscope;
                                picture-in-picture;
                                web-share
                            "
                            allowfullscreen
                        ></iframe>

                    </div>

                  `
                : `
                    <div class="trailer-section">

                        <h3>
                            Trailer
                        </h3>

                        <p
                            style="
                                color:#888;
                                padding:20px 0;
                            "
                        >
                            No trailer is available
                            for this movie.
                        </p>

                    </div>
                  `
        }


        <section class="reviews-section">

            <h3>
                Community Reviews
            </h3>


            <div
                class="review-form-container"
                id="reviewFormContainer"
            ></div>


            <div
                class="reviews-list"
                id="reviewsList"
            ></div>

        </section>

    `;


    setupDetailButtons();

    renderReviewForm();

    renderReviews(
        movie.id
    );

}


/* ============================================================
   33. DETAIL BUTTONS
============================================================ */

function setupDetailButtons() {

    getElement(
        "detailFavoriteButton"
    )?.addEventListener(
        "click",
        () => {

            toggleMovieStatus(
                "favorite"
            );

        }
    );


    getElement(
        "detailWatchedButton"
    )?.addEventListener(
        "click",
        () => {

            toggleMovieStatus(
                "watched"
            );

        }
    );


    getElement(
        "detailTowatchButton"
    )?.addEventListener(
        "click",
        () => {

            toggleMovieStatus(
                "towatch"
            );

        }
    );

}


/* ============================================================
   34. TOGGLE MOVIE STATUS
============================================================ */

function toggleMovieStatus(
    status
) {

    if (!state.currentMovie) {

        return;

    }


    if (!state.currentUser) {

        showToast(
            "Please sign in first."
        );

        openAccountModal();

        return;

    }


    const movie =
        state.currentMovie;


    if (
        movieIsInCollection(
            movie.id,
            status
        )
    ) {

        removeMovieFromCollection(
            movie.id,
            status
        );


        showToast(
            `Removed from ${
                getStatusLabel(status)
            }.`
        );

    } else {

        addMovieToCollection(
            movie,
            status
        );


        showToast(
            `Added to ${
                getStatusLabel(status)
            }.`
        );

    }


    renderMovieDetails(
        movie,
        state.currentTrailerKey
            ? {
                key:
                    state.currentTrailerKey
            }
            : null
    );


    updateWatchlistCounts();

}


/* ============================================================
   35. STATUS LABEL
============================================================ */

function getStatusLabel(
    status
) {

    const labels = {

        favorite: "Favorites",

        watched: "Already Watched",

        towatch: "To Be Watched"

    };


    return labels[
        status
    ] || "Watch List";

}


/* ============================================================
   36. MOVIE MODAL SETUP
============================================================ */

function setupMovieModal() {

    getElement(
        "movieModalClose"
    )?.addEventListener(
        "click",
        closeMovieModal
    );


    getElement(
        "movieModal"
    )?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "movieModal"
            ) {

                closeMovieModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeMovieModal();

                closeAccountModal();

            }

        }
    );

}


/* ============================================================
   37. CLOSE MOVIE MODAL
============================================================ */

function closeMovieModal() {

    const modal =
        getElement(
            "movieModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";


    const details =
        getElement(
            "movieDetails"
        );


    if (details) {

        details.innerHTML = "";

    }


    state.currentMovie =
        null;


    state.currentTrailerKey =
        null;

}


/* ============================================================
   38. HERO BUTTONS
============================================================ */

function setupHeroButtons() {

    getElement(
        "heroInfoButton"
    )?.addEventListener(
        "click",
        () => {

            if (
                state.heroMovie
            ) {

                openMovieDetails(
                    state.heroMovie.id
                );

            }

        }
    );


    getElement(
        "heroTrailerButton"
    )?.addEventListener(
        "click",
        async () => {

            if (
                !state.heroMovie
            ) {

                return;

            }


            openMovieDetails(
                state.heroMovie.id
            );

        }
    );

}


/* ============================================================
   39. UPDATE HERO
============================================================ */

function updateHero(
    movie
) {

    const title =
        getElement(
            "heroTitle"
        );


    const description =
        getElement(
            "heroDescription"
        );


    const year =
        getElement(
            "heroYear"
        );


    const rating =
        getElement(
            "heroRating"
        );


    if (!movie) {

        return;

    }


    if (title) {

        title.textContent =
            movie.title ||
            movie.name ||
            "MovieFlix";

    }


    if (description) {

        description.textContent =
            movie.overview ||
            "Discover your next favorite movie.";

    }


    if (year) {

        year.textContent =
            getMovieYear(
                movie
            );

    }


    if (rating) {

        rating.textContent =
            `⭐ ${Number(
                movie.vote_average || 0
            ).toFixed(1)}`;

    }


    const hero =
        getElement(
            "hero"
        );


    if (
        hero &&
        movie.backdrop_path
    ) {

        hero.style.backgroundImage = `url("${TMDB_BACKDROP_URL}${movie.backdrop_path}")`;

        hero.style.backgroundSize =
            "cover";

        hero.style.backgroundPosition =
            "center";

    }

}


/* ============================================================
   40. SEARCH
============================================================ */

function setupSearch() {

    const input =
        getElement(
            "searchInput"
        );


    if (!input) {

        return;

    }


    input.addEventListener(
        "input",
        () => {

            const query =
                input.value.trim();


            clearTimeout(
                state.searchTimeout
            );


            if (!query) {

                hideSearchResults();

                return;

            }


            state.searchTimeout =
                setTimeout(
                    () => {

                        searchMovies(
                            query
                        );

                    },
                    450
                );

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();


                const query =
                    input.value.trim();


                if (query) {

                    searchMovies(
                        query
                    );

                }

            }

        }
    );

}


/* ============================================================
   41. SEARCH MOVIES
============================================================ */

async function searchMovies(
    query
) {

    navigateTo(
        "home"
    );


    const section =
        getElement(
            "searchResultsSection"
        );


    const container =
        getElement(
            "searchResults"
        );


    const queryText =
        getElement(
            "searchQuery"
        );


    section?.classList.remove(
        "hidden"
    );


    if (queryText) {

        queryText.textContent =
            `Results for "${query}"`;

    }


    if (container) {

        container.innerHTML = `

            <div
                class="loading-message"
                style="grid-column:1/-1;"
            >

                <div class="loader"></div>

                <p>
                    Searching...
                </p>

            </div>

        `;

    }


    try {

        const data =
            await tmdbFetch(
                "/search/movie",
                {

                    query,

                    page: 1,

                    include_adult:
                        false

                }
            );


        const movies =
            data.results || [];


        if (!movies.length) {

            container.innerHTML = `

                <div
                    class="loading-message"
                    style="grid-column:1/-1;"
                >

                    <i
                        class="fa-solid fa-film"
                        style="font-size:35px;"
                    ></i>

                    <p>
                        No movies found.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML =
            movies
                .map(
                    movie =>
                        createMovieCard(
                            movie
                        )
                )
                .join("");


        attachMovieCardEvents(
            container
        );


        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        container.innerHTML = `

            <p
                class="loading-message"
                style="grid-column:1/-1;"
            >
                Search failed.
            </p>

        `;

    }

}


/* ============================================================
   42. HIDE SEARCH RESULTS
============================================================ */

function hideSearchResults() {

    getElement(
        "searchResultsSection"
    )?.classList.add(
        "hidden"
    );

}


/* ============================================================
   43. MOVIES PAGE
============================================================ */

let moviesLoaded = false;


async function loadMoviesPage() {

    await loadGenres();

    await fetchMoviesPage();

    moviesLoaded = true;

}


/* ============================================================
   44. GENRES
============================================================ */

async function loadGenres() {

    const select =
        getElement(
            "genreFilter"
        );


    if (!select) {

        return;

    }


    if (
        select.options.length > 1
    ) {

        return;

    }


    try {

        const data =
            await tmdbFetch(
                "/genre/movie/list"
            );


        data.genres?.forEach(
            genre => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    genre.id;


                option.textContent =
                    genre.name;


                select.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Genre error:",
            error
        );

    }

}


/* ============================================================
   45. MOVIE FILTERS
============================================================ */

function setupFilters() {

    getElement(
        "genreFilter"
    )?.addEventListener(
        "change",
        () => {

            state.moviesPage = 1;

            fetchMoviesPage();

        }
    );


    getElement(
        "sortFilter"
    )?.addEventListener(
        "change",
        () => {

            state.moviesPage = 1;

            fetchMoviesPage();

        }
    );

}


/* ============================================================
   46. FETCH MOVIE PAGE
============================================================ */

async function fetchMoviesPage() {

    const container =
        getElement(
            "allMovies"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        createLoadingCards(
            10
        );


    const genre =
        getElement(
            "genreFilter"
        )?.value ||
        "all";


    const sort =
        getElement(
            "sortFilter"
        )?.value ||
        "popularity.desc";


    const params = {

        page:
            state.moviesPage,

        sort_by:
            sort,

        include_adult:
            false,

        include_video:
            false

    };


    if (
        genre !== "all"
    ) {

        params.with_genres =
            genre;

    }


    try {

        const data =
            await tmdbFetch(
                "/discover/movie",
                params
            );


        container.innerHTML =
            data.results
                ?.map(
                    movie =>
                        createMovieCard(
                            movie
                        )
                )
                .join("") ||
            "";


        attachMovieCardEvents(
            container
        );


        updatePagination(
            data.page,
            data.total_pages
        );

    } catch (error) {

        console.error(
            "Movies page error:",
            error
        );


        container.innerHTML = `

            <p
                class="loading-message"
                style="grid-column:1/-1;"
            >

                Unable to load movies.

            </p>

        `;

    }

}


/* ============================================================
   47. LOADING CARDS
============================================================ */

function createLoadingCards(
    count
) {

    return Array.from(
        {
            length: count
        },
        () =>
            `<div class="movie-loading"></div>`
    ).join("");

}


/* ============================================================
   48. PAGINATION
============================================================ */

function setupPagination() {

    getElement(
        "previousPage"
    )?.addEventListener(
        "click",
        () => {

            if (
                state.moviesPage <= 1
            ) {

                return;

            }


            state.moviesPage--;

            fetchMoviesPage();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    getElement(
        "nextPage"
    )?.addEventListener(
        "click",
        () => {

            state.moviesPage++;

            fetchMoviesPage();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


/* ============================================================
   49. UPDATE PAGINATION
============================================================ */

function updatePagination(
    current,
    total
) {

    const number =
        getElement(
            "pageNumber"
        );


    const previous =
        getElement(
            "previousPage"
        );


    const next =
        getElement(
            "nextPage"
        );


    if (number) {

        number.textContent =
            current;

    }


    if (previous) {

        previous.disabled =
            current <= 1;

    }


    if (next) {

        next.disabled =
            current >=
            Math.min(
                total || 1,
                500
            );

    }

}


/* ============================================================
   50. WATCHLIST
============================================================ */

function setupWatchlist() {

    document
        .querySelectorAll(
            ".watchlist-tab"
        )
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        state.currentWatchStatus =
                            tab.dataset.watchStatus;


                        document
                            .querySelectorAll(
                                ".watchlist-tab"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        tab.classList.add(
                            "active"
                        );


                        renderWatchlist();

                    }
                );

            }
        );

}


/* ============================================================
   51. RENDER WATCHLIST
============================================================ */

function renderWatchlist() {

    const container =
        getElement(
            "watchlistMovies"
        );


    const empty =
        getElement(
            "emptyWatchlist"
        );


    if (!container) {

        return;

    }


    if (!state.currentUser) {

        container.innerHTML = "";

        empty?.classList.remove(
            "hidden"
        );


        if (empty) {

            empty.querySelector(
                "h2"
            ).textContent =
                "Sign in to use your Watch List";


            empty.querySelector(
                "p"
            ).textContent =
                "Create an account to save favorites, watched movies and movies you want to watch.";

        }


        return;

    }


    const collection =
        getUserCollection();


    const movies =
        collection[
            state.currentWatchStatus
        ] || [];


    if (!movies.length) {

        container.innerHTML = "";

        empty?.classList.remove(
            "hidden"
        );


        if (empty) {

            empty.querySelector(
                "h2"
            ).textContent =
                "Nothing here yet";


            empty.querySelector(
                "p"
            ).textContent =
                `Add movies to ${
                    getStatusLabel(
                        state.currentWatchStatus
                    )
                } from any movie card.`;

        }


        return;

    }


    empty?.classList.add(
        "hidden"
    );


    container.innerHTML =
        movies
            .map(
                movie =>
                    createWatchlistCard(
                        movie,
                        state.currentWatchStatus
                    )
            )
            .join("");


    attachWatchlistEvents(
        container
    );

}


/* ============================================================
   52. WATCHLIST CARD
============================================================ */

function createWatchlistCard(
    movie,
    status
) {

    const title =
        movie.title ||
        "Unknown Movie";


    const poster =
        getPosterUrl(
            movie.poster_path
        );


    const year =
        getMovieYear(
            movie
        );


    const rating =
        Number(
            movie.vote_average || 0
        ).toFixed(1);


    return `

        <article
            class="movie-card"
            data-watch-id="${movie.id}"
        >

            <div class="movie-poster">

                ${
                    poster
                        ? `
                            <img
                                src="${poster}"
                                alt="${escapeHTML(title)}"
                            >
                          `
                        : `
                            <div
                                style="
                                    height:100%;
                                    display:grid;
                                    place-items:center;
                                "
                            >
                                <i
                                    class="fa-solid fa-film"
                                    style="font-size:30px;color:#777;"
                                ></i>
                            </div>
                          `
                }


                <div class="movie-overlay">

                    <button
                        class="movie-info-button"
                        type="button"
                        data-watch-info="${movie.id}"
                    >

                        <i
                            class="fa-solid fa-circle-info"
                        ></i>

                        More Info

                    </button>

                </div>

            </div>


            <div class="movie-card-body">

                <div
                    class="movie-title"
                    title="${escapeHTML(title)}"
                >
                    ${escapeHTML(title)}
                </div>


                <div class="movie-meta">

                    <span>
                        ${year}
                    </span>


                    <span class="movie-rating">

                        ⭐ ${rating}

                    </span>

                </div>


                <button
                    class="secondary-button remove-watch-button"
                    type="button"
                    data-remove-id="${movie.id}"
                    style="
                        width:100%;
                        margin-top:10px;
                        min-height:36px;
                        font-size:12px;
                    "
                >

                    <i
                        class="fa-solid fa-trash"
                    ></i>

                    Remove

                </button>

            </div>

        </article>

    `;

}


/* ============================================================
   53. WATCHLIST EVENTS
============================================================ */

function attachWatchlistEvents(
    container
) {

    container
        .querySelectorAll(
            ".movie-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.closest(
                                ".movie-info-button"
                            ) ||
                            event.target.closest(
                                ".remove-watch-button"
                            )
                        ) {

                            return;

                        }


                        openMovieDetails(
                            card.dataset.watchId
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".movie-info-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        openMovieDetails(
                            button.dataset.watchInfo
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".remove-watch-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        removeMovieFromCollection(
                            button.dataset.removeId,
                            state.currentWatchStatus
                        );


                        showToast(
                            "Movie removed."
                        );


                        renderWatchlist();

                    }
                );

            }
        );

}


/* ============================================================
   54. WATCHLIST COUNTS
============================================================ */

function updateWatchlistCounts() {

    const collection =
        getUserCollection();


    const favoriteCount =
        collection.favorite.length;


    const watchedCount =
        collection.watched.length;


    const towatchCount =
        collection.towatch.length;


    const favorite =
        getElement(
            "favoriteCount"
        );


    const watched =
        getElement(
            "watchedCount"
        );


    const towatch =
        getElement(
            "watchlaterCount"
        );


    if (favorite) {

        favorite.textContent =
            favoriteCount;

    }


    if (watched) {

        watched.textContent =
            watchedCount;

    }


    if (towatch) {

        towatch.textContent =
            towatchCount;

    }


    const dashboardFavorite =
        getElement(
            "dashboardFavoriteCount"
        );


    const dashboardWatched =
        getElement(
            "dashboardWatchedCount"
        );


    const dashboardTowatch =
        getElement(
            "dashboardToWatchCount"
        );


    const dashboardReviews =
        getElement(
            "dashboardReviewCount"
        );


    if (dashboardFavorite) {

        dashboardFavorite.textContent =
            favoriteCount;

    }


    if (dashboardWatched) {

        dashboardWatched.textContent =
            watchedCount;

    }


    if (dashboardTowatch) {

        dashboardTowatch.textContent =
            towatchCount;

    }


    if (dashboardReviews) {

        dashboardReviews.textContent =
            getCurrentUserReviewCount();

    }

}


/* ============================================================
   55. ACCOUNT MODAL
============================================================ */

function setupAccountModal() {

    getElement(
        "accountButton"
    )?.addEventListener(
        "click",
        openAccountModal
    );


    getElement(
        "accountClose"
    )?.addEventListener(
        "click",
        closeAccountModal
    );


    getElement(
        "accountOverlay"
    )?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "accountOverlay"
            ) {

                closeAccountModal();

            }

        }
    );


    getElement(
        "showRegister"
    )?.addEventListener(
        "click",
        showRegisterForm
    );


    getElement(
        "showLogin"
    )?.addEventListener(
        "click",
        showLoginForm
    );


    getElement(
        "loginFormElement"
    )?.addEventListener(
        "submit",
        handleLogin
    );


    getElement(
        "registerFormElement"
    )?.addEventListener(
        "submit",
        handleRegister
    );


    document
        .querySelectorAll(
            ".password-toggle"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        togglePassword(
                            button.dataset.target,
                            button
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-account-page]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showAccountPage(
                            button.dataset.accountPage
                        );

                    }
                );

            }
        );


    getElement(
        "saveProfileButton"
    )?.addEventListener(
        "click",
        saveProfile
    );


    getElement(
        "logoutButton"
    )?.addEventListener(
        "click",
        logout
    );


    getElement(
        "deleteAccountButton"
    )?.addEventListener(
        "click",
        deleteAccount
    );

}


/* ============================================================
   56. OPEN ACCOUNT MODAL
============================================================ */

function openAccountModal() {

    const overlay =
        getElement(
            "accountOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";


    updateAccountUI();

}


/* ============================================================
   57. CLOSE ACCOUNT MODAL
============================================================ */

function closeAccountModal() {

    const overlay =
        getElement(
            "accountOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}


/* ============================================================
   58. UPDATE ACCOUNT UI
============================================================ */

function updateAccountUI() {

    const auth =
        getElement(
            "accountAuth"
        );


    const dashboard =
        getElement(
            "accountDashboard"
        );


    const accountButton =
        getElement(
            "accountButton"
        );


    if (
        state.currentUser
    ) {

        auth?.classList.add(
            "hidden"
        );


        dashboard?.classList.remove(
            "hidden"
        );


        updateProfileUI();


        showAccountPage(
            "profile"
        );


        if (accountButton) {

            accountButton.innerHTML = `

                <i
                    class="fa-solid fa-user-check"
                ></i>

                <span>
                    ${escapeHTML(
                        state.currentUser.name
                    )}
                </span>

            `;

        }

    } else {

        auth?.classList.remove(
            "hidden"
        );


        dashboard?.classList.add(
            "hidden"
        );


        showLoginForm();


        if (accountButton) {

            accountButton.innerHTML = `

                <i
                    class="fa-regular fa-user"
                ></i>

                <span>
                    Account
                </span>

            `;

        }

    }


    updateWatchlistCounts();

}


/* ============================================================
   59. LOGIN FORM
============================================================ */

function showLoginForm() {

    getElement(
        "loginForm"
    )?.classList.remove(
        "hidden"
    );


    getElement(
        "registerForm"
    )?.classList.add(
        "hidden"
    );


    clearAuthErrors();

}


/* ============================================================
   60. REGISTER FORM
============================================================ */

function showRegisterForm() {

    getElement(
        "loginForm"
    )?.classList.add(
        "hidden"
    );


    getElement(
        "registerForm"
    )?.classList.remove(
        "hidden"
    );


    clearAuthErrors();

}


/* ============================================================
   61. CLEAR AUTH ERRORS
============================================================ */

function clearAuthErrors() {

    const loginError =
        getElement(
            "loginError"
        );


    const registerError =
        getElement(
            "registerError"
        );


    if (loginError) {

        loginError.textContent =
            "";

    }


    if (registerError) {

        registerError.textContent =
            "";

    }

}


/* ============================================================
   62. REGISTER
============================================================ */

function handleRegister(
    event
) {

    event.preventDefault();


    const name =
        getElement(
            "registerName"
        )?.value.trim();


    const email =
        getElement(
            "registerEmail"
        )?.value.trim()
        .toLowerCase();


    const password =
        getElement(
            "registerPassword"
        )?.value;


    const confirmPassword =
        getElement(
            "registerConfirmPassword"
        )?.value;


    const error =
        getElement(
            "registerError"
        );


    if (!name || !email || !password) {

        error.textContent =
            "Please fill in all fields.";

        return;

    }


    if (
        password.length < 6
    ) {

        error.textContent =
            "Password must contain at least 6 characters.";

        return;

    }


    if (
        password !==
        confirmPassword
    ) {

        error.textContent =
            "Passwords do not match.";

        return;

    }


    const users =
        getUsers();


    const exists =
        users.some(
            user =>
                user.email ===
                email
        );


    if (exists) {

        error.textContent =
            "An account with this email already exists.";

        return;

    }


    /*
       Educational localStorage authentication.

       For a real production website,
       passwords must NEVER be stored this way.
    */

    const user = {

        id:
            Date.now(),

        name,

        email,

        password,

        createdAt:
            new Date().toISOString()

    };


    users.push(
        user
    );


    saveUsers(
        users
    );


    const collections =
        getCollections();


    collections[email] = {

        favorite: [],

        watched: [],

        towatch: []

    };


    saveCollections(
        collections
    );


    state.currentUser =
        user;


    saveCurrentUser();


    updateAccountUI();

    updateWatchlistCounts();


    showToast(
        "Account created successfully!"
    );


    getElement(
        "registerFormElement"
    )?.reset();

}


/* ============================================================
   63. LOGIN
============================================================ */

function handleLogin(
    event
) {

    event.preventDefault();


    const email =
        getElement(
            "loginEmail"
        )?.value.trim()
        .toLowerCase();


    const password =
        getElement(
            "loginPassword"
        )?.value;


    const error =
        getElement(
            "loginError"
        );


    const users =
        getUsers();


    const user =
        users.find(
            item =>
                item.email ===
                    email &&
                item.password ===
                    password
        );


    if (!user) {

        error.textContent =
            "Incorrect email or password.";

        return;

    }


    state.currentUser =
        user;


    saveCurrentUser();


    updateAccountUI();

    updateWatchlistCounts();


    showToast(
        `Welcome back, ${user.name}!`
    );


    getElement(
        "loginFormElement"
    )?.reset();

}


/* ============================================================
   64. PASSWORD TOGGLE
============================================================ */

function togglePassword(
    inputId,
    button
) {

    const input =
        getElement(
            inputId
        );


    if (!input) {

        return;

    }


    const isPassword =
        input.type ===
        "password";


    input.type =
        isPassword
            ? "text"
            : "password";


    const icon =
        button.querySelector(
            "i"
        );


    if (icon) {

        icon.className =
            isPassword
                ? "fa-solid fa-eye-slash"
                : "fa-solid fa-eye";

    }

}


/* ============================================================
   65. PROFILE UI
============================================================ */

function updateProfileUI() {

    if (!state.currentUser) {

        return;

    }


    const name =
        state.currentUser.name;


    const email =
        state.currentUser.email;


    const profileName =
        getElement(
            "profileName"
        );


    const profileEmail =
        getElement(
            "profileEmail"
        );


    const avatar =
        getElement(
            "profileAvatar"
        );


    const editName =
        getElement(
            "editProfileName"
        );


    if (profileName) {

        profileName.textContent =
            name;

    }


    if (profileEmail) {

        profileEmail.textContent =
            email;

    }


    if (avatar) {

        avatar.textContent =
            getInitials(
                name
            );

    }


    if (editName) {

        editName.value =
            name;

    }

}


/* ============================================================
   66. INITIALS
============================================================ */

function getInitials(
    name
) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word[0]
                    .toUpperCase()
        )
        .join("");

}


/* ============================================================
   67. ACCOUNT PAGE
============================================================ */

function showAccountPage(
    page
) {

    document
        .querySelectorAll(
            ".account-page"
        )
        .forEach(
            section => {

                section.classList.add(
                    "hidden"
                );

            }
        );


    document
        .querySelectorAll(
            ".account-menu-item"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.accountPage ===
                        page
                );

            }
        );


    const target =
        getElement(
            `accountPage${capitalize(
                page
            )}`
        );


    target?.classList.remove(
        "hidden"
    );


    updateWatchlistCounts();

}


/* ============================================================
   68. CAPITALIZE
============================================================ */

function capitalize(
    value
) {

    return value.charAt(0)
        .toUpperCase() +
        value.slice(1);

}


/* ============================================================
   69. SAVE PROFILE
============================================================ */

function saveProfile() {

    if (!state.currentUser) {

        return;

    }


    const newName =
        getElement(
            "editProfileName"
        )?.value.trim();


    if (!newName) {

        showToast(
            "Please enter a name."
        );

        return;

    }


    const users =
        getUsers();


    const index =
        users.findIndex(
            user =>
                user.email ===
                state.currentUser.email
        );


    if (
        index === -1
    ) {

        return;

    }


    users[index].name =
        newName;


    state.currentUser =
        users[index];


    saveUsers(
        users
    );


    saveCurrentUser();


    updateProfileUI();


    updateAccountUI();


    showToast(
        "Profile updated."
    );

}


/* ============================================================
   70. LOGOUT
============================================================ */

function logout() {

    state.currentUser =
        null;


    saveCurrentUser();


    closeAccountModal();


    updateAccountUI();


    updateWatchlistCounts();


    showToast(
        "You have been signed out."
    );


    if (
        state.currentPage ===
        "watchlist"
    ) {

        renderWatchlist();

    }

}


/* ============================================================
   71. DELETE ACCOUNT
============================================================ */

function deleteAccount() {

    if (!state.currentUser) {

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete your account? This will remove your saved movies and reviews."
        );


    if (!confirmed) {

        return;

    }


    const email =
        state.currentUser.email;


    const users =
        getUsers()
            .filter(
                user =>
                    user.email !==
                    email
            );


    saveUsers(
        users
    );


    const collections =
        getCollections();


    delete collections[
        email
    ];


    saveCollections(
        collections
    );


    const reviews =
        getReviews();


    delete reviews[
        email
    ];


    saveReviews(
        reviews
    );


    state.currentUser =
        null;


    saveCurrentUser();


    updateAccountUI();

    updateWatchlistCounts();


    closeAccountModal();


    showToast(
        "Account deleted."
    );


    if (
        state.currentPage ===
        "watchlist"
    ) {

        renderWatchlist();

    }

}


/* ============================================================
   72. REVIEW STORAGE
============================================================ */

function getMovieReviews(
    movieId
) {

    const reviews =
        getReviews();


    return (
        reviews[
            String(movieId)
        ] || []
    );

}


/* ============================================================
   73. SAVE MOVIE REVIEWS
============================================================ */

function saveMovieReviews(
    movieId,
    movieReviews
) {

    const reviews =
        getReviews();


    reviews[
        String(movieId)
    ] =
        movieReviews;


    saveReviews(
        reviews
    );

}


/* ============================================================
   74. RENDER REVIEW FORM
============================================================ */

function renderReviewForm() {

    const container =
        getElement(
            "reviewFormContainer"
        );


    if (!container) {

        return;

    }


    if (!state.currentUser) {

        container.innerHTML = `

            <div class="login-review-message">

                <p
                    style="
                        color:#aaa;
                        margin-bottom:12px;
                    "
                >
                    Sign in to write a review.
                </p>


                <button
                    class="secondary-button"
                    type="button"
                    id="reviewLoginButton"
                >

                    Sign In

                </button>

            </div>

        `;


        getElement(
            "reviewLoginButton"
        )?.addEventListener(
            "click",
            () => {

                openAccountModal();

            }
        );


        return;

    }


    const existingReview =
        findCurrentUserReview();


    state.currentReviewRating =
        existingReview
            ? existingReview.rating
            : 0;


    container.innerHTML = `

        <form
            class="review-form"
            id="reviewForm"
        >

            <h4>
                ${
                    existingReview
                        ? "Edit your review"
                        : "Write a review"
                }
            </h4>


            <div
                class="review-rating-selector"
            >

                <span>
                    Your rating:
                </span>


                <div
                    class="review-stars"
                    id="reviewStars"
                >

                    ${createReviewStars()}

                </div>

            </div>


            <textarea
                class="review-textarea"
                id="reviewText"
                maxlength="1000"
                placeholder="What did you think about this movie?"
                required
            >${
                existingReview
                    ? escapeHTML(
                        existingReview.text
                    )
                    : ""
            }</textarea>


            <div
                class="review-form-footer"
            >

                <span
                    class="review-count"
                    id="reviewCharacterCount"
                >
                    0 / 1000
                </span>


                <button
                    class="auth-submit"
                    type="submit"
                    style="
                        width:auto;
                        padding:0 18px;
                    "
                >

                    ${
                        existingReview
                            ? "Update Review"
                            : "Publish Review"
                    }

                </button>

            </div>

        </form>

    `;


    setupReviewForm();

}


/* ============================================================
   75. CREATE REVIEW STARS
============================================================ */

function createReviewStars() {

    return [1, 2, 3, 4, 5]
        .map(
            number =>
                `
                <button
                    class="review-star ${
                        number <=
                        state.currentReviewRating
                            ? "active"
                            : ""
                    }"
                    type="button"
                    data-rating="${number}"
                    aria-label="${number} stars"
                >
                    <i
                        class="fa-solid fa-star"
                    ></i>
                </button>
                `
        )
        .join("");

}


/* ============================================================
   76. REVIEW FORM EVENTS
============================================================ */

function setupReviewForm() {

    const form =
        getElement(
            "reviewForm"
        );


    const textarea =
        getElement(
            "reviewText"
        );


    const counter =
        getElement(
            "reviewCharacterCount"
        );


    document
        .querySelectorAll(
            ".review-star"
        )
        .forEach(
            star => {

                star.addEventListener(
                    "click",
                    () => {

                        state.currentReviewRating =
                            Number(
                                star.dataset.rating
                            );


                        document
                            .querySelectorAll(
                                ".review-star"
                            )
                            .forEach(
                                item => {

                                    item.classList.toggle(
                                        "active",
                                        Number(
                                            item.dataset.rating
                                        ) <=
                                            state.currentReviewRating
                                    );

                                }
                            );

                    }
                );

            }
        );


    textarea?.addEventListener(
        "input",
        () => {

            if (counter) {

                counter.textContent =
                    `${textarea.value.length} / 1000`;

            }

        }
    );


    if (textarea && counter) {

        counter.textContent =
            `${textarea.value.length} / 1000`;

    }


    form?.addEventListener(
        "submit",
        handleReviewSubmit
    );

}


/* ============================================================
   77. FIND CURRENT USER REVIEW
============================================================ */

function findCurrentUserReview() {

    if (
        !state.currentUser ||
        !state.currentMovie
    ) {

        return null;

    }


    const reviews =
        getMovieReviews(
            state.currentMovie.id
        );


    return (
        reviews.find(
            review =>
                review.userEmail ===
                state.currentUser.email
        ) ||
        null
    );

}


/* ============================================================
   78. REVIEW SUBMIT
============================================================ */

function handleReviewSubmit(
    event
) {

    event.preventDefault();


    if (
        !state.currentUser ||
        !state.currentMovie
    ) {

        return;

    }


    const textarea =
        getElement(
            "reviewText"
        );


    const text =
        textarea?.value.trim();


    if (
        state.currentReviewRating <
        1
    ) {

        showToast(
            "Please select a rating."
        );

        return;

    }


    if (!text) {

        showToast(
            "Please write something in your review."
        );

        return;

    }


    const movie =
        state.currentMovie;


    const reviews =
        getMovieReviews(
            movie.id
        );


    const existingIndex =
        reviews.findIndex(
            review =>
                review.userEmail ===
                state.currentUser.email
        );


    const review = {

        id:
            existingIndex >= 0
                ? reviews[
                    existingIndex
                ].id
                : Date.now(),

        movieId:
            movie.id,

        userEmail:
            state.currentUser.email,

        userName:
            state.currentUser.name,

        rating:
            state.currentReviewRating,

        text,

        updatedAt:
            new Date().toISOString()

    };


    if (
        existingIndex >= 0
    ) {

        reviews[
            existingIndex
        ] =
            review;

        showToast(
            "Review updated."
        );

    } else {

        review.createdAt =
            new Date().toISOString();


        reviews.push(
            review
        );


        showToast(
            "Review published."
        );

    }


    saveMovieReviews(
        movie.id,
        reviews
    );


    renderReviewForm();

    renderReviews(
        movie.id
    );

    updateWatchlistCounts();

}


/* ============================================================
   79. RENDER REVIEWS
============================================================ */

function renderReviews(
    movieId
) {

    const container =
        getElement(
            "reviewsList"
        );


    if (!container) {

        return;

    }


    const reviews =
        getMovieReviews(
            movieId
        );


    if (!reviews.length) {

        container.innerHTML = `

            <div
                style="
                    padding:20px;
                    text-align:center;
                    color:#777;
                    background:rgba(255,255,255,.03);
                    border-radius:8px;
                "
            >

                No reviews yet.
                Be the first to review this movie!

            </div>

        `;

        return;

    }


    const sortedReviews =
        [...reviews].sort(
            (
                a,
                b
            ) =>
                new Date(
                    b.updatedAt ||
                    b.createdAt
                ) -
                new Date(
                    a.updatedAt ||
                    a.createdAt
                )
        );


    container.innerHTML =
        sortedReviews
            .map(
                review =>
                    createReviewCard(
                        review
                    )
            )
            .join("");


    attachReviewEvents(
        container
    );

}


/* ============================================================
   80. REVIEW CARD
============================================================ */

function createReviewCard(
    review
) {

    const isOwner =
        state.currentUser &&
        review.userEmail ===
            state.currentUser.email;


    const stars =
        "★".repeat(
            review.rating
        ) +
        "☆".repeat(
            5 - review.rating
        );


    const date =
        formatDate(
            review.updatedAt ||
            review.createdAt
        );


    return `

        <article
            class="review-card"
            data-review-id="${review.id}"
        >

            <div class="review-header">

                <div class="review-user">

                    <div class="review-avatar">

                        ${escapeHTML(
                            getInitials(
                                review.userName
                            )
                        )}

                    </div>


                    <div class="review-user-info">

                        <strong>
                            ${escapeHTML(
                                review.userName
                            )}
                        </strong>


                        <small>
                            ${date}
                        </small>

                    </div>

                </div>


                <div class="review-rating">

                    ${stars}

                </div>

            </div>


            <p class="review-body">

                ${escapeHTML(
                    review.text
                )}

            </p>


            ${
                isOwner
                    ? `

                        <div class="review-actions">

                            <button
                                class="review-action edit-review"
                                type="button"
                                data-review-id="${review.id}"
                            >

                                <i
                                    class="fa-solid fa-pen"
                                ></i>

                                Edit

                            </button>


                            <button
                                class="review-action delete delete-review"
                                type="button"
                                data-review-id="${review.id}"
                            >

                                <i
                                    class="fa-solid fa-trash"
                                ></i>

                                Delete

                            </button>

                        </div>

                      `
                    : ""
            }

        </article>

    `;

}


/* ============================================================
   81. REVIEW EVENTS
============================================================ */

function attachReviewEvents(
    container
) {

    container
        .querySelectorAll(
            ".edit-review"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const review =
                            findReviewById(
                                button.dataset.reviewId
                            );


                        if (!review) {

                            return;

                        }


                        state.currentReviewRating =
                            review.rating;


                        renderReviewForm();


                        getElement(
                            "reviewText"
                        )?.focus();


                        getElement(
                            "reviewForm"
                        )?.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "center"
                        });

                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".delete-review"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteReview(
                            button.dataset.reviewId
                        );

                    }
                );

            }
        );

}


/* ============================================================
   82. FIND REVIEW
============================================================ */

function findReviewById(
    reviewId
) {

    if (!state.currentMovie) {

        return null;

    }


    const reviews =
        getMovieReviews(
            state.currentMovie.id
        );


    return (
        reviews.find(
            review =>
                String(review.id) ===
                String(reviewId)
        ) ||
        null
    );

}


/* ============================================================
   83. DELETE REVIEW
============================================================ */

function deleteReview(
    reviewId
) {

    if (
        !state.currentMovie ||
        !state.currentUser
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Delete your review?"
        );


    if (!confirmed) {

        return;

    }


    let reviews =
        getMovieReviews(
            state.currentMovie.id
        );


    reviews =
        reviews.filter(
            review =>
                !(
                    String(review.id) ===
                        String(reviewId) &&
                    review.userEmail ===
                        state.currentUser.email
                )
        );


    saveMovieReviews(
        state.currentMovie.id,
        reviews
    );


    state.currentReviewRating =
        0;


    renderReviewForm();

    renderReviews(
        state.currentMovie.id
    );

    updateWatchlistCounts();


    showToast(
        "Review deleted."
    );

}


/* ============================================================
   84. CURRENT USER REVIEW COUNT
============================================================ */

function getCurrentUserReviewCount() {

    if (!state.currentUser) {

        return 0;

    }


    const allReviews =
        getReviews();


    let count = 0;


    Object.values(
        allReviews
    )
        .forEach(
            movieReviews => {

                if (
                    Array.isArray(
                        movieReviews
                    )
                ) {

                    count +=
                        movieReviews.filter(
                            review =>
                                review.userEmail ===
                                state.currentUser.email
                        ).length;

                }

            }
        );


    return count;

}


/* ============================================================
   85. GLOBAL SAFETY
============================================================ */

/*
   These are exposed globally because some browser
   interactions and dynamically generated elements may
   need access to them.
*/

window.openMovieDetails =
    openMovieDetails;

window.closeMovieModal =
    closeMovieModal;

window.openAccountModal =
    openAccountModal;

window.closeAccountModal =
    closeAccountModal;


/* ============================================================
   86. FINAL DEBUG MESSAGE
============================================================ */

console.log(
    "MovieFlix initialized successfully."
);