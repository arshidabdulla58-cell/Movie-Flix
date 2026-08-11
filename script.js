// ============================================================
// MOVIEFLIX - TMDB JAVASCRIPT
// PART 1: CONFIGURATION + API + DOM
// ============================================================

const API_KEY = "686025cbe0ca0165a1059efee08a15f1";

const API_BASE = "https://api.themoviedb.org/3";

const IMAGE_BASE =
    "https://image.tmdb.org/t/p/w500";

const BACKDROP_BASE =
    "https://image.tmdb.org/t/p/original";


// ============================================================
// APP STATE
// ============================================================

let currentMovie = null;
let heroMovie = null;

let myList =
    JSON.parse(
        localStorage.getItem("movieflix-list") || "[]"
    );


// ============================================================
// DOM ELEMENTS
// ============================================================

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


const loadingScreen =
    $("#loadingScreen");

const hero =
    $(".hero");

const heroTitle =
    $("#heroTitle");

const heroDescription =
    $("#heroDescription");

const heroYear =
    $("#heroYear");

const heroRating =
    $("#heroRating");

const heroPlay =
    $("#heroPlay");

const heroInfo =
    $("#heroInfo");


const trendingMovies =
    $("#trendingMovies");

const popularMovies =
    $("#popularMovies");

const topRatedMovies =
    $("#topRatedMovies");

const actionMovies =
    $("#actionMovies");

const myListMovies =
    $("#myListMovies");

const emptyList =
    $("#emptyList");


const movieModal =
    $("#movieModal");

const modalBackdrop =
    $("#modalBackdrop");

const modalClose =
    $("#modalClose");

const modalImage =
    $("#modalImage");

const modalTitle =
    $("#modalTitle");

const modalYear =
    $("#modalYear");

const modalRating =
    $("#modalRating");

const modalRuntime =
    $("#modalRuntime");

const modalGenres =
    $("#modalGenres");

const modalDescription =
    $("#modalDescription");

const modalTrailer =
    $("#modalTrailer");

const modalList =
    $("#modalList");


const toast =
    $("#toast");


const searchButton =
    $("#searchButton");

const searchBox =
    $("#searchBox");

const searchInput =
    $("#searchInput");

const closeSearch =
    $("#closeSearch");

const searchResultsSection =
    $("#searchResultsSection");

const searchResults =
    $("#searchResults");

const searchQuery =
    $("#searchQuery");


// ============================================================
// EXTRA MOVIE CATEGORIES
// ============================================================

const extraCategories = [

    {
        id: "comedyMovies",

        title: "Comedy Movies",

        endpoint:
            "/discover/movie?language=en-US&sort_by=popularity.desc&with_genres=35&page=1"
    },

    {
        id: "horrorMovies",

        title: "Horror Movies",

        endpoint:
            "/discover/movie?language=en-US&sort_by=popularity.desc&with_genres=27&page=1"
    },

    {
        id: "scifiMovies",

        title: "Sci-Fi Movies",

        endpoint:
            "/discover/movie?language=en-US&sort_by=popularity.desc&with_genres=878&page=1"
    },

    {
        id: "upcomingMovies",

        title: "Coming Soon",

        endpoint:
            "/movie/upcoming?language=en-US&page=1"
    }

];


// ============================================================
// CREATE EXTRA SECTIONS
// ============================================================

function createExtraSections() {

    if (!myListMovies) {
        return;
    }

    if ($("#extraCategories")) {
        return;
    }


    const wrapper =
        document.createElement("div");

    wrapper.id =
        "extraCategories";


    extraCategories.forEach(
        (category) => {

            const section =
                document.createElement("section");

            section.className =
                "section";


            section.innerHTML = `

                <div class="section-header">

                    <h2>

                        <span class="red-line"></span>

                        ${escapeHTML(
                            category.title
                        )}

                    </h2>

                    <button
                        class="see-all dynamic-see-all"
                        type="button"
                        data-target="${category.id}"
                    >

                        See All

                        <i class="fa-solid fa-chevron-right"></i>

                    </button>

                </div>


                <div
                    class="movie-row"
                    id="${category.id}"
                ></div>

            `;


            wrapper.appendChild(
                section
            );

        }
    );


    const myListSection =
        myListMovies.closest(
            ".section"
        );


    if (myListSection) {

        myListSection.parentNode.insertBefore(
            wrapper,
            myListSection
        );

    }

}


// ============================================================
// TMDB API FUNCTION
// ============================================================

async function fetchAPI(endpoint) {

    if (
        !API_KEY ||
        API_KEY ===
            "PASTE_YOUR_TMDB_API_KEY_HERE"
    ) {

        throw new Error(
            "TMDB API key is missing."
        );

    }


    const separator =
        endpoint.includes("?")
            ? "&"
            : "?";


    const url =
        `${API_BASE}${endpoint}` +
        `${separator}api_key=${encodeURIComponent(
            API_KEY
        )}`;


    console.log(
        "🌐 TMDB:",
        endpoint
    );


    const response =
        await fetch(url);


    if (!response.ok) {

        let message =
            `TMDB request failed (${response.status})`;


        try {

            const errorData =
                await response.json();


            if (
                errorData.status_message
            ) {

                message =
                    errorData.status_message;

            }

        } catch (error) {

            // Ignore JSON parsing errors.

        }


        throw new Error(
            message
        );

    }


    return response.json();

}
// ============================================================
// PART 2: LOAD MOVIES
// ============================================================

async function loadMovies() {

    console.log(
        "🎬 MovieFlix starting..."
    );


    createExtraSections();


    try {

        const requests = [

            // Trending
            fetchAPI(
                "/trending/movie/week?language=en-US"
            ),

            // Popular
            fetchAPI(
                "/movie/popular?language=en-US&page=1"
            ),

            // Top Rated
            fetchAPI(
                "/movie/top_rated?language=en-US&page=1"
            ),

            // Action
            fetchAPI(
                "/discover/movie?language=en-US&sort_by=popularity.desc&with_genres=28&page=1"
            )

        ];


        const results =
            await Promise.allSettled(
                requests
            );


        const [
            trending,
            popular,
            topRated,
            action
        ] = results;


        // ====================================================
        // TRENDING
        // ====================================================

        if (
            trending.status ===
            "fulfilled"
        ) {

            renderMovies(
                trending.value.results,
                trendingMovies
            );


            setupHero(
                trending.value.results
            );

        } else {

            showSectionError(
                trendingMovies
            );

            console.error(
                trending.reason
            );

        }


        // ====================================================
        // POPULAR
        // ====================================================

        if (
            popular.status ===
            "fulfilled"
        ) {

            renderMovies(
                popular.value.results,
                popularMovies
            );

        } else {

            showSectionError(
                popularMovies
            );

            console.error(
                popular.reason
            );

        }


        // ====================================================
        // TOP RATED
        // ====================================================

        if (
            topRated.status ===
            "fulfilled"
        ) {

            renderMovies(
                topRated.value.results,
                topRatedMovies
            );

        } else {

            showSectionError(
                topRatedMovies
            );

            console.error(
                topRated.reason
            );

        }


        // ====================================================
        // ACTION
        // ====================================================

        if (
            action.status ===
            "fulfilled"
        ) {

            renderMovies(
                action.value.results,
                actionMovies
            );

        } else {

            showSectionError(
                actionMovies
            );

            console.error(
                action.reason
            );

        }


        // ====================================================
        // EXTRA CATEGORIES
        // ====================================================

        await loadExtraCategories();


        // ====================================================
        // MY LIST
        // ====================================================

        renderMyList();


        console.log(
            "✅ MovieFlix loaded successfully."
        );


    } catch (error) {

        console.error(
            "❌ MovieFlix error:",
            error
        );


        showToast(
            error.message ||
            "Something went wrong."
        );

    } finally {

        hideLoading();

    }

}


// ============================================================
// LOAD EXTRA CATEGORIES
// ============================================================

async function loadExtraCategories() {

    const jobs =
        extraCategories.map(
            async (category) => {

                const container =
                    document.getElementById(
                        category.id
                    );


                if (!container) {
                    return;
                }


                try {

                    const data =
                        await fetchAPI(
                            category.endpoint
                        );


                    renderMovies(
                        data.results || [],
                        container
                    );


                } catch (error) {

                    console.error(
                        `❌ ${category.title}:`,
                        error
                    );


                    showSectionError(
                        container
                    );

                }

            }
        );


    await Promise.allSettled(
        jobs
    );

}
// ============================================================
// PART 3: HERO SECTION
// ============================================================

function setupHero(movies) {

    if (
        !hero ||
        !movies ||
        !movies.length
    ) {

        return;
    }


    heroMovie =

        movies.find(
            (movie) =>
                movie.backdrop_path &&
                Number(
                    movie.vote_average || 0
                ) >= 7
        )

        ||

        movies.find(
            (movie) =>
                movie.backdrop_path
        )

        ||

        movies[0];


    if (!heroMovie) {
        return;
    }


    // ========================================================
    // BACKGROUND
    // ========================================================

    if (
        heroMovie.backdrop_path
    ) {

        hero.style.backgroundImage =
            `url("${BACKDROP_BASE}${heroMovie.backdrop_path}")`;

    }


    // ========================================================
    // TITLE
    // ========================================================

    if (heroTitle) {

        heroTitle.textContent =
            heroMovie.title ||
            "MovieFlix";

    }


    // ========================================================
    // DESCRIPTION
    // ========================================================

    if (heroDescription) {

        heroDescription.textContent =
            heroMovie.overview ||
            "Discover your next favorite movie.";

    }


    // ========================================================
    // YEAR
    // ========================================================

    if (heroYear) {

        heroYear.textContent =
            getYear(
                heroMovie.release_date
            );

    }


    // ========================================================
    // RATING
    // ========================================================

    if (heroRating) {

        heroRating.textContent =
            `⭐ ${formatRating(
                heroMovie.vote_average
            )}`;

    }

}


// ============================================================
// HERO PLAY BUTTON
// ============================================================

if (heroPlay) {

    heroPlay.addEventListener(
        "click",
        () => {

            if (heroMovie) {

                openMovie(
                    heroMovie.id
                );

            }

        }
    );

}


// ============================================================
// HERO MORE INFO BUTTON
// ============================================================

if (heroInfo) {

    heroInfo.addEventListener(
        "click",
        () => {

            if (heroMovie) {

                openMovie(
                    heroMovie.id
                );

            }

        }
    );

}
// ============================================================
// PART 4: MOVIE CARDS
// ============================================================

function renderMovies(
    movies,
    container
) {

    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const validMovies =
        (movies || []).filter(
            (movie) =>
                movie &&
                movie.poster_path
        );


    if (
        !validMovies.length
    ) {

        showSectionError(
            container
        );

        return;
    }


    validMovies.forEach(
        (movie) => {

            container.appendChild(
                createMovieCard(movie)
            );

        }
    );

}


// ============================================================
// CREATE ONE MOVIE CARD
// ============================================================

function createMovieCard(movie) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "movie-card";


    const title =
        movie.title ||
        movie.name ||
        "Unknown Movie";


    const inList =
        isInMyList(
            movie.id
        );


    card.innerHTML = `

        <img
            src="${IMAGE_BASE}${movie.poster_path}"
            alt="${escapeHTML(title)}"
            loading="lazy"
        >


        <button
            class="add-list"
            type="button"
            aria-label="${
                inList
                    ? "Remove from My List"
                    : "Add to My List"
            }"
            title="${
                inList
                    ? "Remove from My List"
                    : "Add to My List"
            }"
        >

            <i class="fa-solid ${
                inList
                    ? "fa-check"
                    : "fa-plus"
            }"></i>

        </button>


        <div class="movie-info">

            <div class="movie-title">

                ${escapeHTML(title)}

            </div>


            <div class="movie-year">

                ${escapeHTML(
                    getYear(
                        movie.release_date
                    )
                )}

            </div>


            <div class="movie-rating">

                ⭐ ${
                    formatRating(
                        movie.vote_average
                    )
                }

            </div>

        </div>

    `;


    // ========================================================
    // OPEN DETAILS
    // ========================================================

    card.addEventListener(
        "click",
        (event) => {

            if (
                event.target.closest(
                    ".add-list"
                )
            ) {

                return;

            }


            openMovie(
                movie.id
            );

        }
    );


    // ========================================================
    // MY LIST BUTTON
    // ========================================================

    const listButton =
        card.querySelector(
            ".add-list"
        );


    listButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();


            toggleMyList(
                movie
            );

        }
    );


    return card;

}
// ============================================================
// PART 5: MOVIE DETAILS
// ============================================================

async function openMovie(
    movieId
) {

    if (!movieId) {
        return;
    }


    try {

        showToast(
            "Loading movie details..."
        );


        const movie =
            await fetchAPI(
                `/movie/${movieId}?language=en-US&append_to_response=credits,videos`
            );


        currentMovie =
            movie;


        // ====================================================
        // TITLE
        // ====================================================

        if (modalTitle) {

            modalTitle.textContent =
                movie.title ||
                "Unknown Movie";

        }


        // ====================================================
        // YEAR
        // ====================================================

        if (modalYear) {

            modalYear.textContent =
                getYear(
                    movie.release_date
                );

        }


        // ====================================================
        // RATING
        // ====================================================

        if (modalRating) {

            modalRating.textContent =
                `⭐ ${formatRating(
                    movie.vote_average
                )}`;

        }


        // ====================================================
        // RUNTIME
        // ====================================================

        if (modalRuntime) {

            modalRuntime.textContent =
                movie.runtime
                    ? `${movie.runtime} min`
                    : "N/A";

        }


        // ====================================================
        // DESCRIPTION
        // ====================================================

        if (modalDescription) {

            modalDescription.textContent =
                movie.overview ||
                "No description available.";

        }


        // ====================================================
        // BACKDROP
        // ====================================================

        if (modalImage) {

            if (
                movie.backdrop_path
            ) {

                modalImage.style.backgroundImage =
                    `url("${BACKDROP_BASE}${movie.backdrop_path}")`;

            } else if (
                movie.poster_path
            ) {

                modalImage.style.backgroundImage =
                    `url("${IMAGE_BASE}${movie.poster_path}")`;

            } else {

                modalImage.style.backgroundImage =
                    "none";

            }

        }


        // ====================================================
        // GENRES
        // ====================================================

        if (modalGenres) {

            modalGenres.innerHTML =
                "";


            (movie.genres || [])
                .forEach(
                    (genre) => {

                        const tag =
                            document.createElement(
                                "span"
                            );


                        tag.className =
                            "genre";


                        tag.textContent =
                            genre.name;


                        modalGenres.appendChild(
                            tag
                        );

                    }
                );

        }


        // ====================================================
        // UPDATE MY LIST BUTTON
        // ====================================================

        updateModalListButton();


        // ====================================================
        // SHOW MODAL
        // ====================================================

        if (movieModal) {

            movieModal.classList.add(
                "active"
            );

        }


        document.body.style.overflow =
            "hidden";


    } catch (error) {

        console.error(
            "❌ Movie details:",
            error
        );


        showToast(
            "Could not load movie details."
        );

    }

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    if (!movieModal) {
        return;
    }


    movieModal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}


if (modalClose) {

    modalClose.addEventListener(
        "click",
        closeModal
    );

}


if (modalBackdrop) {

    modalBackdrop.addEventListener(
        "click",
        closeModal
    );

}


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Escape"
        ) {

            closeModal();

        }

    }
);
// ============================================================
// PART 6: TRAILER + MY LIST
// ============================================================


// ============================================================
// TRAILER
// ============================================================

if (modalTrailer) {

    modalTrailer.addEventListener(
        "click",
        async () => {

            if (!currentMovie) {
                return;
            }


            const videos =
                currentMovie.videos?.results ||
                [];


            const trailer =

                videos.find(
                    (video) =>
                        video.site ===
                            "YouTube" &&
                        video.type ===
                            "Trailer" &&
                        video.official ===
                            true
                )

                ||

                videos.find(
                    (video) =>
                        video.site ===
                            "YouTube" &&
                        video.type ===
                            "Trailer"
                )

                ||

                videos.find(
                    (video) =>
                        video.site ===
                        "YouTube"
                );


            if (trailer) {

                window.open(
                    `https://www.youtube.com/watch?v=${trailer.key}`,
                    "_blank"
                );

                return;
            }


            // Fallback search

            const query =
                encodeURIComponent(
                    `${currentMovie.title} official trailer`
                );


            window.open(
                `https://www.youtube.com/results?search_query=${query}`,
                "_blank"
            );

        }
    );

}


// ============================================================
// CHECK MY LIST
// ============================================================

function isInMyList(
    movieId
) {

    return myList.some(
        (movie) =>
            movie.id === movieId
    );

}


// ============================================================
// TOGGLE MY LIST
// ============================================================

function toggleMyList(
    movie
) {

    if (
        !movie ||
        !movie.id
    ) {

        return;

    }


    if (
        isInMyList(
            movie.id
        )
    ) {

        myList =
            myList.filter(
                (item) =>
                    item.id !==
                    movie.id
            );


        showToast(
            "Removed from My List."
        );


    } else {

        myList.push({

            id:
                movie.id,

            title:
                movie.title,

            poster_path:
                movie.poster_path,

            backdrop_path:
                movie.backdrop_path,

            release_date:
                movie.release_date,

            vote_average:
                movie.vote_average,

            overview:
                movie.overview

        });


        showToast(
            "Added to My List ❤️"
        );

    }


    saveMyList();


    renderMyList();


    updateModalListButton();

}


// ============================================================
// SAVE MY LIST
// ============================================================

function saveMyList() {

    localStorage.setItem(
        "movieflix-list",
        JSON.stringify(
            myList
        )
    );

}


// ============================================================
// RENDER MY LIST
// ============================================================

function renderMyList() {

    if (!myListMovies) {
        return;
    }


    myListMovies.innerHTML =
        "";


    if (
        !myList.length
    ) {

        if (emptyList) {

            emptyList.style.display =
                "block";

        }

        return;

    }


    if (emptyList) {

        emptyList.style.display =
            "none";

    }


    renderMovies(
        myList,
        myListMovies
    );

}


// ============================================================
// UPDATE MODAL MY LIST BUTTON
// ============================================================

function updateModalListButton() {

    if (
        !currentMovie ||
        !modalList
    ) {

        return;

    }


    const exists =
        isInMyList(
            currentMovie.id
        );


    if (exists) {

        modalList.innerHTML = `

            <i class="fa-solid fa-check"></i>

            Remove from My List

        `;

    } else {

        modalList.innerHTML = `

            <i class="fa-solid fa-plus"></i>

            My List

        `;

    }

}


// ============================================================
// MODAL MY LIST BUTTON
// ============================================================

if (modalList) {

    modalList.addEventListener(
        "click",
        () => {

            if (currentMovie) {

                toggleMyList(
                    currentMovie
                );

            }

        }
    );

}
// ============================================================
// PART 7: SEARCH
// ============================================================

let searchTimer = null;


// ============================================================
// OPEN SEARCH
// ============================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        () => {

            searchBox.classList.toggle(
                "active"
            );


            if (
                searchBox.classList.contains(
                    "active"
                )
            ) {

                searchInput.focus();

            }

        }
    );

}


// ============================================================
// CLOSE SEARCH
// ============================================================

if (closeSearch) {

    closeSearch.addEventListener(
        "click",
        () => {

            searchBox.classList.remove(
                "active"
            );


            searchInput.value =
                "";


            if (
                searchResultsSection
            ) {

                searchResultsSection.classList.add(
                    "hidden"
                );

            }

        }
    );

}


// ============================================================
// SEARCH INPUT
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            clearTimeout(
                searchTimer
            );


            const query =
                searchInput.value.trim();


            if (!query) {

                searchResultsSection.classList.add(
                    "hidden"
                );

                return;

            }


            searchTimer =
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


    searchInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();


                clearTimeout(
                    searchTimer
                );


                const query =
                    searchInput.value.trim();


                if (query) {

                    searchMovies(
                        query
                    );

                }

            }

        }
    );

}


// ============================================================
// SEARCH MOVIES
// ============================================================

async function searchMovies(
    query
) {

    try {

        if (
            searchResultsSection
        ) {

            searchResultsSection.classList.remove(
                "hidden"
            );

        }


        if (searchQuery) {

            searchQuery.textContent =
                `"${query}"`;

        }


        if (searchResults) {

            searchResults.innerHTML = `

                <p style="
                    color:#888;
                    padding:20px;
                ">

                    Searching for
                    "${escapeHTML(query)}"...

                </p>

            `;

        }


        const data =
            await fetchAPI(
                `/search/movie?language=en-US&query=${encodeURIComponent(
                    query
                )}&page=1&include_adult=false`
            );


        renderMovies(
            data.results || [],
            searchResults
        );


        if (
            searchResultsSection
        ) {

            searchResultsSection.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "start"
            });

        }


    } catch (error) {

        console.error(
            "❌ Search:",
            error
        );


        showToast(
            "Search failed."
        );

    }

}
// ============================================================
// PART 8: NAVIGATION + HELPERS + START APP
// ============================================================


// ============================================================
// SEE ALL BUTTONS
// ============================================================

$$(".see-all").forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const sectionName =
                    button.dataset.section;


                let target =
                    null;


                if (
                    sectionName ===
                    "trending"
                ) {

                    target =
                        trendingMovies;

                } else if (
                    sectionName ===
                    "popular"
                ) {

                    target =
                        popularMovies;

                } else if (
                    button.dataset.target
                ) {

                    target =
                        document.getElementById(
                            button.dataset.target
                        );

                }


                if (!target) {
                    return;
                }


                target.scrollTo({

                    left:
                        target.scrollWidth,

                    behavior:
                        "smooth"

                });

            }
        );

    }
);


// ============================================================
// HEADER SCROLL EFFECT
// ============================================================

window.addEventListener(
    "scroll",
    () => {

        const header =
            $(".header");


        if (!header) {
            return;
        }


        header.classList.toggle(
            "scrolled",
            window.scrollY > 40
        );

    }
);


// ============================================================
// NAVIGATION
// ============================================================

$$(".nav-link").forEach(
    (link) => {

        link.addEventListener(
            "click",
            () => {

                $$(".nav-link").forEach(
                    (item) => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                link.classList.add(
                    "active"
                );

            }
        );

    }
);


// ============================================================
// TOAST
// ============================================================

let toastTimer = null;


function showToast(
    message
) {

    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


// ============================================================
// GET YEAR
// ============================================================

function getYear(
    date
) {

    if (!date) {
        return "N/A";
    }


    return String(
        date
    ).substring(
        0,
        4
    );

}


// ============================================================
// FORMAT RATING
// ============================================================

function formatRating(
    value
) {

    const rating =
        Number(value);


    if (
        !Number.isFinite(
            rating
        ) ||
        rating <= 0
    ) {

        return "N/A";

    }


    return rating.toFixed(
        1
    );

}


// ============================================================
// SECTION ERROR
// ============================================================

function showSectionError(
    container
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <p style="
            color:#777;
            padding:15px 0;
            font-size:13px;
        ">

            Movies could not be loaded.

        </p>

    `;

}


// ============================================================
// HIDE LOADING
// ============================================================

function hideLoading() {

    if (!loadingScreen) {
        return;
    }


    loadingScreen.classList.add(
        "hide"
    );


    setTimeout(
        () => {

            loadingScreen.style.display =
                "none";

        },
        600
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ============================================================
// START MOVIEFLIX
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🚀 MovieFlix initialized"
        );


        loadMovies();

    }
);
// ============================================================
// MOVIEFLIX ACCOUNT SYSTEM
// PART 3 - AUTHENTICATION
// ============================================================


// ============================================================
// ACCOUNT STORAGE
// ============================================================

const ACCOUNT_STORAGE_KEY =
    "movieflix-accounts";

const CURRENT_USER_KEY =
    "movieflix-current-user";

const SETTINGS_STORAGE_KEY =
    "movieflix-settings";


// ============================================================
// ACCOUNT DOM ELEMENTS
// ============================================================

const accountButton =
    document.getElementById(
        "accountButton"
    );

const accountOverlay =
    document.getElementById(
        "accountOverlay"
    );

const accountModal =
    document.getElementById(
        "accountModal"
    );

const accountClose =
    document.getElementById(
        "accountClose"
    );


const accountAuth =
    document.getElementById(
        "accountAuth"
    );

const accountDashboard =
    document.getElementById(
        "accountDashboard"
    );


const loginForm =
    document.getElementById(
        "loginForm"
    );

const registerForm =
    document.getElementById(
        "registerForm"
    );


const loginFormElement =
    document.getElementById(
        "loginFormElement"
    );

const registerFormElement =
    document.getElementById(
        "registerFormElement"
    );


const showRegister =
    document.getElementById(
        "showRegister"
    );

const showLogin =
    document.getElementById(
        "showLogin"
    );


const loginEmail =
    document.getElementById(
        "loginEmail"
    );

const loginPassword =
    document.getElementById(
        "loginPassword"
    );


const registerName =
    document.getElementById(
        "registerName"
    );

const registerEmail =
    document.getElementById(
        "registerEmail"
    );

const registerPassword =
    document.getElementById(
        "registerPassword"
    );


const loginError =
    document.getElementById(
        "loginError"
    );

const registerError =
    document.getElementById(
        "registerError"
    );


const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profileName =
    document.getElementById(
        "profileName"
    );

const profileEmail =
    document.getElementById(
        "profileEmail"
    );


const dashboardName =
    document.getElementById(
        "dashboardName"
    );

const dashboardEmail =
    document.getElementById(
        "dashboardEmail"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const accountPageProfile =
    document.getElementById(
        "accountPageProfile"
    );

const accountPageSettings =
    document.getElementById(
        "accountPageSettings"
    );

const accountPageList =
    document.getElementById(
        "accountPageList"
    );


const goToMyList =
    document.getElementById(
        "goToMyList"
    );


const autoplaySetting =
    document.getElementById(
        "autoplaySetting"
    );

const notificationSetting =
    document.getElementById(
        "notificationSetting"
    );


// ============================================================
// GET ACCOUNTS
// ============================================================

function getAccounts() {

    try {

        return JSON.parse(
            localStorage.getItem(
                ACCOUNT_STORAGE_KEY
            ) || "[]"
        );

    } catch (error) {

        console.error(
            "Could not read accounts:",
            error
        );

        return [];

    }

}


// ============================================================
// SAVE ACCOUNTS
// ============================================================

function saveAccounts(
    accounts
) {

    localStorage.setItem(
        ACCOUNT_STORAGE_KEY,
        JSON.stringify(accounts)
    );

}


// ============================================================
// GET CURRENT USER
// ============================================================

function getCurrentUser() {

    try {

        return JSON.parse(
            localStorage.getItem(
                CURRENT_USER_KEY
            ) || "null"
        );

    } catch (error) {

        return null;

    }

}


// ============================================================
// SAVE CURRENT USER
// ============================================================

function saveCurrentUser(
    user
) {

    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(user)
    );

}


// ============================================================
// REMOVE CURRENT USER
// ============================================================

function removeCurrentUser() {

    localStorage.removeItem(
        CURRENT_USER_KEY
    );

}


// ============================================================
// OPEN ACCOUNT
// ============================================================

if (accountButton) {

    accountButton.addEventListener(
        "click",
        () => {

            openAccount();

        }
    );

}


// ============================================================
// OPEN ACCOUNT FUNCTION
// ============================================================

function openAccount() {

    if (!accountOverlay) {
        return;
    }


    const user =
        getCurrentUser();


    if (user) {

        showAccountDashboard();

    } else {

        showLoginForm();

    }


    accountOverlay.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


// ============================================================
// CLOSE ACCOUNT
// ============================================================

if (accountClose) {

    accountClose.addEventListener(
        "click",
        closeAccount
    );

}


if (accountOverlay) {

    accountOverlay.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                accountOverlay
            ) {

                closeAccount();

            }

        }
    );

}


// ============================================================
// CLOSE WITH ESCAPE
// ============================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            accountOverlay &&
            accountOverlay.classList.contains(
                "active"
            )
        ) {

            closeAccount();

        }

    }
);


// ============================================================
// CLOSE ACCOUNT FUNCTION
// ============================================================

function closeAccount() {

    if (!accountOverlay) {
        return;
    }


    accountOverlay.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}


// ============================================================
// SHOW LOGIN FORM
// ============================================================

function showLoginForm() {

    if (accountAuth) {

        accountAuth.classList.remove(
            "hidden"
        );

    }


    if (accountDashboard) {

        accountDashboard.classList.add(
            "hidden"
        );

    }


    if (loginForm) {

        loginForm.classList.remove(
            "hidden"
        );

    }


    if (registerForm) {

        registerForm.classList.add(
            "hidden"
        );

    }


    clearAuthErrors();

}


// ============================================================
// SHOW REGISTER FORM
// ============================================================

function showRegisterForm() {

    if (accountAuth) {

        accountAuth.classList.remove(
            "hidden"
        );

    }


    if (accountDashboard) {

        accountDashboard.classList.add(
            "hidden"
        );

    }


    if (loginForm) {

        loginForm.classList.add(
            "hidden"
        );

    }


    if (registerForm) {

        registerForm.classList.remove(
            "hidden"
        );

    }


    clearAuthErrors();

}


// ============================================================
// SHOW ACCOUNT DASHBOARD
// ============================================================

function showAccountDashboard() {

    const user =
        getCurrentUser();


    if (!user) {

        showLoginForm();

        return;

    }


    if (accountAuth) {

        accountAuth.classList.add(
            "hidden"
        );

    }


    if (accountDashboard) {

        accountDashboard.classList.remove(
            "hidden"
        );

    }


    updateProfileUI(
        user
    );


    loadAccountSettings();


    showAccountPage(
        "profile"
    );

}


// ============================================================
// UPDATE PROFILE UI
// ============================================================

function updateProfileUI(
    user
) {

    if (!user) {
        return;
    }


    const name =
        user.name ||
        "MovieFlix User";


    const email =
        user.email ||
        "";


    if (profileName) {

        profileName.textContent =
            name;

    }


    if (profileEmail) {

        profileEmail.textContent =
            email;

    }


    if (dashboardName) {

        dashboardName.textContent =
            name;

    }


    if (dashboardEmail) {

        dashboardEmail.textContent =
            email;

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            getInitials(name);

    }

}


// ============================================================
// GET INITIALS
// ============================================================

function getInitials(
    name
) {

    const words =
        String(name)
            .trim()
            .split(/\s+/);


    if (!words.length) {
        return "U";
    }


    if (words.length === 1) {

        return words[0]
            .substring(0, 1)
            .toUpperCase();

    }


    return (
        words[0].charAt(0) +
        words[1].charAt(0)
    ).toUpperCase();

}


// ============================================================
// SWITCH LOGIN / REGISTER
// ============================================================

if (showRegister) {

    showRegister.addEventListener(
        "click",
        () => {

            showRegisterForm();

        }
    );

}


if (showLogin) {

    showLogin.addEventListener(
        "click",
        () => {

            showLoginForm();

        }
    );

}


// ============================================================
// REGISTER ACCOUNT
// ============================================================

if (registerFormElement) {

    registerFormElement.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            clearAuthErrors();


            const name =
                registerName.value.trim();


            const email =
                registerEmail.value
                    .trim()
                    .toLowerCase();


            const password =
                registerPassword.value;


            // -----------------------------------------------
            // VALIDATION
            // -----------------------------------------------

            if (
                name.length <
                2
            ) {

                showAuthError(
                    registerError,
                    "Please enter your name."
                );

                return;

            }


            if (
                !isValidEmail(
                    email
                )
            ) {

                showAuthError(
                    registerError,
                    "Please enter a valid email address."
                );

                return;

            }


            if (
                password.length <
                6
            ) {

                showAuthError(
                    registerError,
                    "Password must contain at least 6 characters."
                );

                return;

            }


            // -----------------------------------------------
            // CHECK EXISTING ACCOUNT
            // -----------------------------------------------

            const accounts =
                getAccounts();


            const existingAccount =
                accounts.find(
                    (account) =>
                        account.email ===
                        email
                );


            if (existingAccount) {

                showAuthError(
                    registerError,
                    "An account with this email already exists."
                );

                return;

            }


            // -----------------------------------------------
            // CREATE USER
            // -----------------------------------------------

            const newUser = {

                id:
                    "user_" +
                    Date.now(),

                name:
                    name,

                email:
                    email,

                password:
                    password,

                createdAt:
                    new Date().toISOString(),

                myList:
                    []

            };


            accounts.push(
                newUser
            );


            saveAccounts(
                accounts
            );


            // -----------------------------------------------
            // LOGIN AUTOMATICALLY
            // -----------------------------------------------

            const sessionUser = {

                id:
                    newUser.id,

                name:
                    newUser.name,

                email:
                    newUser.email

            };


            saveCurrentUser(
                sessionUser
            );


            // -----------------------------------------------
            // RESET FORM
            // -----------------------------------------------

            registerFormElement.reset();


            showToast(
                "Account created successfully! 🎉"
            );


            // -----------------------------------------------
            // SHOW DASHBOARD
            // -----------------------------------------------

            showAccountDashboard();

        }
    );

}


// ============================================================
// LOGIN ACCOUNT
// ============================================================

if (loginFormElement) {

    loginFormElement.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            clearAuthErrors();


            const email =
                loginEmail.value
                    .trim()
                    .toLowerCase();


            const password =
                loginPassword.value;


            if (
                !isValidEmail(
                    email
                )
            ) {

                showAuthError(
                    loginError,
                    "Please enter a valid email address."
                );

                return;

            }


            if (!password) {

                showAuthError(
                    loginError,
                    "Please enter your password."
                );

                return;

            }


            const accounts =
                getAccounts();


            const user =
                accounts.find(
                    (account) =>
                        account.email ===
                            email &&
                        account.password ===
                            password
                );


            if (!user) {

                showAuthError(
                    loginError,
                    "Incorrect email or password."
                );

                return;

            }


            // -----------------------------------------------
            // CREATE LOGIN SESSION
            // -----------------------------------------------

            const sessionUser = {

                id:
                    user.id,

                name:
                    user.name,

                email:
                    user.email

            };


            saveCurrentUser(
                sessionUser
            );


            loginFormElement.reset();


            showToast(
                `Welcome back, ${user.name}! 👋`
            );


            showAccountDashboard();

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            removeCurrentUser();


            showToast(
                "You have been signed out."
            );


            showLoginForm();


            setTimeout(
                () => {

                    closeAccount();

                },
                700
            );

        }
    );

}


// ============================================================
// PASSWORD VISIBILITY
// ============================================================

$$(".password-toggle").forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const targetId =
                    button.dataset.target;


                const input =
                    document.getElementById(
                        targetId
                    );


                if (!input) {
                    return;
                }


                if (
                    input.type ===
                    "password"
                ) {

                    input.type =
                        "text";


                    button.innerHTML =
                        `<i class="fa-solid fa-eye-slash"></i>`;

                } else {

                    input.type =
                        "password";


                    button.innerHTML =
                        `<i class="fa-solid fa-eye"></i>`;

                }

            }
        );

    }
);


// ============================================================
// ACCOUNT MENU
// ============================================================

$$(".account-menu-item").forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.accountPage;


                showAccountPage(
                    page
                );


                $$(".account-menu-item")
                    .forEach(
                        (item) => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                button.classList.add(
                    "active"
                );

            }
        );

    }
);


// ============================================================
// SHOW ACCOUNT PAGE
// ============================================================

function showAccountPage(
    page
) {

    const pages = [

        accountPageProfile,

        accountPageSettings,

        accountPageList

    ];


    pages.forEach(
        (item) => {

            if (item) {

                item.classList.add(
                    "hidden"
                );

            }

        }
    );


    if (
        page === "profile" &&
        accountPageProfile
    ) {

        accountPageProfile.classList.remove(
            "hidden"
        );

    }


    if (
        page === "settings" &&
        accountPageSettings
    ) {

        accountPageSettings.classList.remove(
            "hidden"
        );

    }


    if (
        page === "list" &&
        accountPageList
    ) {

        accountPageList.classList.remove(
            "hidden"
        );

    }

}


// ============================================================
// SETTINGS
// ============================================================

function getAccountSettings() {

    try {

        return JSON.parse(
            localStorage.getItem(
                SETTINGS_STORAGE_KEY
            ) ||
            "{}"
        );

    } catch (error) {

        return {};

    }

}


// ============================================================
// LOAD SETTINGS
// ============================================================

function loadAccountSettings() {

    const settings =
        getAccountSettings();


    if (autoplaySetting) {

        autoplaySetting.checked =
            settings.autoplay === true;

    }


    if (notificationSetting) {

        notificationSetting.checked =
            settings.notifications !== false;

    }

}


// ============================================================
// SAVE SETTINGS
// ============================================================

function saveAccountSettings() {

    const settings = {

        autoplay:
            autoplaySetting
                ? autoplaySetting.checked
                : false,

        notifications:
            notificationSetting
                ? notificationSetting.checked
                : true

    };


    localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
    );

}


// ============================================================
// SETTING EVENT LISTENERS
// ============================================================

if (autoplaySetting) {

    autoplaySetting.addEventListener(
        "change",
        () => {

            saveAccountSettings();

            showToast(
                "Autoplay setting saved."
            );

        }
    );

}


if (notificationSetting) {

    notificationSetting.addEventListener(
        "change",
        () => {

            saveAccountSettings();

            showToast(
                "Notification setting saved."
            );

        }
    );

}


// ============================================================
// GO TO MY LIST
// ============================================================

if (goToMyList) {

    goToMyList.addEventListener(
        "click",
        () => {

            closeAccount();


            const listSection =
                myListMovies
                    ? myListMovies.closest(
                        ".section"
                    )
                    : null;


            if (listSection) {

                listSection.scrollIntoView({
                    behavior:
                        "smooth"
                });

            }

        }
    );

}


// ============================================================
// AUTH ERROR
// ============================================================

function showAuthError(
    element,
    message
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;

}


// ============================================================
// CLEAR AUTH ERRORS
// ============================================================

function clearAuthErrors() {

    if (loginError) {

        loginError.textContent =
            "";

    }


    if (registerError) {

        registerError.textContent =
            "";

    }

}


// ============================================================
// EMAIL VALIDATION
// ============================================================

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


// ============================================================
// UPDATE HEADER ACCOUNT BUTTON
// ============================================================

function updateAccountButton() {

    if (!accountButton) {
        return;
    }


    const user =
        getCurrentUser();


    if (user) {

        accountButton.innerHTML = `

            <i class="fa-solid fa-user"></i>

            <span>
                ${escapeHTML(
                    user.name
                )}
            </span>

        `;

        accountButton.title =
            "Open your account";

    } else {

        accountButton.innerHTML = `

            <i class="fa-solid fa-user"></i>

            <span>
                Account
            </span>

        `;

        accountButton.title =
            "Sign in or create an account";

    }

}


// ============================================================
// CHECK EXISTING LOGIN SESSION
// ============================================================

function initializeAccount() {

    const user =
        getCurrentUser();


    if (user) {

        console.log(
            "👤 Logged in as:",
            user.email
        );

    } else {

        console.log(
            "👤 No account currently logged in."
        );

    }


    updateAccountButton();

}


// ============================================================
// RUN ACCOUNT INITIALIZATION
// ============================================================

initializeAccount();
// ============================================================
// MOVIEFLIX ACCOUNT SYSTEM
// PART 4 - ADVANCED FEATURES
// ============================================================


// ============================================================
// PART 4 ELEMENTS
// ============================================================

const editProfileName =
    document.getElementById(
        "editProfileName"
    );

const editProfileAvatar =
    document.getElementById(
        "editProfileAvatar"
    );

const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );


const currentPassword =
    document.getElementById(
        "currentPassword"
    );

const newPassword =
    document.getElementById(
        "newPassword"
    );

const confirmNewPassword =
    document.getElementById(
        "confirmNewPassword"
    );

const changePasswordButton =
    document.getElementById(
        "changePasswordButton"
    );

const passwordChangeError =
    document.getElementById(
        "passwordChangeError"
    );


const deleteAccountButton =
    document.getElementById(
        "deleteAccountButton"
    );


const accountMyList =
    document.getElementById(
        "accountMyList"
    );

const emptyAccountList =
    document.getElementById(
        "emptyAccountList"
    );


// ============================================================
// LOAD EDIT PROFILE
// ============================================================

function loadEditProfile() {

    const user =
        getCurrentUser();


    if (!user) {
        return;
    }


    if (editProfileName) {

        editProfileName.value =
            user.name || "";

    }


    if (editProfileAvatar) {

        editProfileAvatar.textContent =
            getInitials(
                user.name
            );

    }

}


// ============================================================
// PROFILE NAME PREVIEW
// ============================================================

if (editProfileName) {

    editProfileName.addEventListener(
        "input",
        () => {

            const name =
                editProfileName.value.trim();


            if (editProfileAvatar) {

                editProfileAvatar.textContent =
                    name
                        ? getInitials(name)
                        : "U";

            }

        }
    );

}


// ============================================================
// SAVE PROFILE
// ============================================================

if (saveProfileButton) {

    saveProfileButton.addEventListener(
        "click",
        () => {

            const user =
                getCurrentUser();


            if (!user) {
                return;
            }


            const newName =
                editProfileName.value.trim();


            if (newName.length < 2) {

                showToast(
                    "Name must contain at least 2 characters."
                );

                return;

            }


            // -----------------------------------------------
            // UPDATE SESSION
            // -----------------------------------------------

            user.name =
                newName;


            saveCurrentUser(
                user
            );


            // -----------------------------------------------
            // UPDATE ACCOUNTS
            // -----------------------------------------------

            const accounts =
                getAccounts();


            const accountIndex =
                accounts.findIndex(
                    account =>
                        account.id ===
                        user.id
                );


            if (
                accountIndex !== -1
            ) {

                accounts[
                    accountIndex
                ].name =
                    newName;


                saveAccounts(
                    accounts
                );

            }


            // -----------------------------------------------
            // UPDATE UI
            // -----------------------------------------------

            updateProfileUI(
                user
            );


            updateAccountButton();


            if (editProfileAvatar) {

                editProfileAvatar.textContent =
                    getInitials(
                        newName
                    );

            }


            showToast(
                "Profile updated successfully!"
            );

        }
    );

}


// ============================================================
// CHANGE PASSWORD
// ============================================================

if (changePasswordButton) {

    changePasswordButton.addEventListener(
        "click",
        () => {

            if (passwordChangeError) {

                passwordChangeError.textContent =
                    "";

            }


            const user =
                getCurrentUser();


            if (!user) {

                return;

            }


            const oldPassword =
                currentPassword.value;


            const password =
                newPassword.value;


            const confirmPassword =
                confirmNewPassword.value;


            // -----------------------------------------------
            // CHECK FIELDS
            // -----------------------------------------------

            if (
                !oldPassword ||
                !password ||
                !confirmPassword
            ) {

                passwordChangeError.textContent =
                    "Please fill in all password fields.";

                return;

            }


            // -----------------------------------------------
            // GET ACCOUNT
            // -----------------------------------------------

            const accounts =
                getAccounts();


            const accountIndex =
                accounts.findIndex(
                    account =>
                        account.id ===
                        user.id
                );


            if (
                accountIndex === -1
            ) {

                passwordChangeError.textContent =
                    "Account could not be found.";

                return;

            }


            const account =
                accounts[
                    accountIndex
                ];


            // -----------------------------------------------
            // VERIFY OLD PASSWORD
            // -----------------------------------------------

            if (
                account.password !==
                oldPassword
            ) {

                passwordChangeError.textContent =
                    "Current password is incorrect.";

                return;

            }


            // -----------------------------------------------
            // NEW PASSWORD VALIDATION
            // -----------------------------------------------

            if (
                password.length < 6
            ) {

                passwordChangeError.textContent =
                    "New password must contain at least 6 characters.";

                return;

            }


            if (
                password !==
                confirmPassword
            ) {

                passwordChangeError.textContent =
                    "New passwords do not match.";

                return;

            }


            // -----------------------------------------------
            // UPDATE PASSWORD
            // -----------------------------------------------

            account.password =
                password;


            accounts[
                accountIndex
            ] =
                account;


            saveAccounts(
                accounts
            );


            // -----------------------------------------------
            // CLEAR FIELDS
            // -----------------------------------------------

            currentPassword.value =
                "";

            newPassword.value =
                "";

            confirmNewPassword.value =
                "";


            showToast(
                "Password changed successfully!"
            );

        }
    );

}


// ============================================================
// DELETE ACCOUNT
// ============================================================

if (deleteAccountButton) {

    deleteAccountButton.addEventListener(
        "click",
        () => {

            const user =
                getCurrentUser();


            if (!user) {
                return;
            }


            const confirmation =
                confirm(
                    "Are you sure you want to delete your MovieFlix account?\n\nThis action cannot be undone."
                );


            if (!confirmation) {

                return;

            }


            // -----------------------------------------------
            // REMOVE ACCOUNT
            // -----------------------------------------------

            const accounts =
                getAccounts();


            const remainingAccounts =
                accounts.filter(
                    account =>
                        account.id !==
                        user.id
                );


            saveAccounts(
                remainingAccounts
            );


            // -----------------------------------------------
            // REMOVE SESSION
            // -----------------------------------------------

            removeCurrentUser();


            // -----------------------------------------------
            // CLEAR USER LIST
            // -----------------------------------------------

            localStorage.removeItem(
                `movieflix-list-${user.id}`
            );


            showToast(
                "Your account has been deleted."
            );


            setTimeout(
                () => {

                    closeAccount();

                    showLoginForm();

                    updateAccountButton();

                },
                700
            );

        }
    );

}


// ============================================================
// USER-SPECIFIC MY LIST
// ============================================================

function getUserListKey() {

    const user =
        getCurrentUser();


    if (!user) {
        return null;
    }


    return `movieflix-list-${user.id}`;

}


// ============================================================
// GET USER MY LIST
// ============================================================

function getUserMovieList() {

    const key =
        getUserListKey();


    if (!key) {
        return [];
    }


    try {

        return JSON.parse(
            localStorage.getItem(
                key
            ) || "[]"
        );

    } catch (error) {

        return [];

    }

}


// ============================================================
// SAVE USER MY LIST
// ============================================================

function saveUserMovieList(
    movies
) {

    const key =
        getUserListKey();


    if (!key) {
        return;
    }


    localStorage.setItem(
        key,
        JSON.stringify(movies)
    );

}


// ============================================================
// ADD MOVIE TO USER LIST
// ============================================================

function addMovieToUserList(
    movie
) {

    const user =
        getCurrentUser();


    if (!user) {

        showToast(
            "Please sign in to save movies."
        );

        return false;

    }


    const movies =
        getUserMovieList();


    const exists =
        movies.some(
            item =>
                item.id ===
                movie.id
        );


    if (exists) {

        return false;

    }


    movies.push(
        movie
    );


    saveUserMovieList(
        movies
    );


    return true;

}


// ============================================================
// REMOVE MOVIE FROM USER LIST
// ============================================================

function removeMovieFromUserList(
    movieId
) {

    const movies =
        getUserMovieList();


    const updatedMovies =
        movies.filter(
            movie =>
                movie.id !==
                movieId
        );


    saveUserMovieList(
        updatedMovies
    );


    renderAccountMyList();

}


// ============================================================
// RENDER ACCOUNT MY LIST
// ============================================================

function renderAccountMyList() {

    if (!accountMyList) {
        return;
    }


    const movies =
        getUserMovieList();


    accountMyList.innerHTML =
        "";


    // -----------------------------------------------
    // EMPTY
    // -----------------------------------------------

    if (!movies.length) {

        accountMyList.classList.add(
            "hidden"
        );


        if (emptyAccountList) {

            emptyAccountList.classList.remove(
                "hidden"
            );

        }


        return;

    }


    // -----------------------------------------------
    // HAS MOVIES
    // -----------------------------------------------

    accountMyList.classList.remove(
        "hidden"
    );


    if (emptyAccountList) {

        emptyAccountList.classList.add(
            "hidden"
        );

    }


    movies.forEach(
        movie => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "account-list-card";


            const poster =
                movie.poster_path
                    ? `${IMAGE_BASE_URL}${movie.poster_path}`
                    : "https://via.placeholder.com/300x450?text=No+Poster";


            card.innerHTML = `

                <img
                    src="${poster}"
                    alt="${escapeHTML(
                        movie.title ||
                        movie.name ||
                        "Movie"
                    )}"
                    loading="lazy"
                >

                <button
                    class="account-list-remove"
                    type="button"
                    title="Remove from My List"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            `;


            const removeButton =
                card.querySelector(
                    ".account-list-remove"
                );


            removeButton.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();


                    removeMovieFromUserList(
                        movie.id
                    );


                    showToast(
                        "Removed from My List."
                    );

                }
            );


            card.addEventListener(
                "click",
                () => {

                    if (
                        typeof showMovieDetails ===
                        "function"
                    ) {

                        showMovieDetails(
                            movie
                        );

                    }

                }
            );


            accountMyList.appendChild(
                card
            );

        }
    );

}


// ============================================================
// WHEN ACCOUNT PAGE OPENS
// ============================================================

const originalShowAccountPage =
    showAccountPage;


showAccountPage =
    function(page) {

        originalShowAccountPage(
            page
        );


        if (
            page === "profile"
        ) {

            loadEditProfile();

        }


        if (
            page === "list"
        ) {

            renderAccountMyList();

        }

    };


// ============================================================
// INITIALIZE PART 4
// ============================================================

loadEditProfile();