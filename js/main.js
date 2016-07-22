(function(){
/* global
    fetch, document, Promise
 */
    "use strict";

    var requestedHeroId = 1,
        heroEl = document.getElementById('hero-info'),
        filmsEl = document.getElementById('films'),
        prevBtn = document.getElementById('prev'),
        nextBtn = document.getElementById('next'),
        hero, films = [],
        /**
         * Moves the first letter to uppercase
         * @param {string} str
         * @returns {string}
         */
        ucFirst = function (str) {
            return !str ? str : str[0].toUpperCase() + str.slice(1);
        },
        /**
         * @param {HTMLElement} node
         */
        cleanNode = function (node) {
            while(node.hasChildNodes()) {
                node.removeChild(node.firstChild)
            }
        },
        /**
         * @param {HeroModel} heroModel
         */
        renderHero = function (heroModel) {
            var heroMap = {
                'Name' : heroModel.name,
                'Height' : heroModel.height + ' m',
                'Mass' : heroModel.mass + ' Kg',
                'Hair color' : heroModel.hair_color,
                'Skin Color' : heroModel.skin_color,
                'Eye Color' : heroModel.eye_color,
                'Birth Year' : heroModel.birth_year.replace('BB', ' BB'),
                'Gender' : heroModel.gender
                }, label,
                tRow = document.createElement('tr'),
                tRowHead = document.createElement('th'),
                tRowData = document.createElement('td'),
                mediaSizes = ['xs', 'sm', 'md', 'lg'];

            mediaSizes.forEach(size => tRowHead.classList.add('col-' + size + '-5'));
            cleanNode(heroEl);
            for (label in heroMap) {
                var rowClone = tRow.cloneNode(true),
                    headerClone = tRowHead.cloneNode(true),
                    dataClone = tRowData.cloneNode(true);
                headerClone.textContent = label;
                dataClone.textContent = ucFirst(heroMap[label]);
                rowClone.appendChild(headerClone);
                rowClone.appendChild(dataClone);
                heroEl.appendChild(rowClone);
            }
        },
        /**
         * @param {Array} films
         */
        renderFilms = function (films) {
            var liEl = document.createElement('a');
            liEl.classList.add('list-group-item');
            liEl.setAttribute('href', '#');
            cleanNode(filmsEl);
            films.forEach(film => {
                var liClone = liEl.cloneNode(true);
                liClone.textContent = film.getFullTitle();
                filmsEl.appendChild(liClone);
            });
        },
        /**
         * Fills properties of target object by values from source object
         * @param {Object} targetObject
         * @param {Object} sourceObject
         * @returns {Object}
         */
        fillObject = function fillObject(targetObject, sourceObject) {
            var prop = '';
            for (prop in sourceObject) {
                if (targetObject.hasOwnProperty(prop)) {
                    targetObject[prop] = sourceObject[prop];
                }
            }

            return targetObject;
        },
        nextHero = function () {
            requestedHeroId += 1;
            loadHero(requestedHeroId);
            if (requestedHeroId > 1 && prevBtn.classList.contains('disabled')) {
                prevBtn.classList.remove('disabled');
            }
            if (requestedHeroId === 88) {
                nextBtn.classList.add('disabled');
            }
        },
        prevHero = function () {
            requestedHeroId -= 1;
            loadHero(requestedHeroId);
            if (requestedHeroId === 1) {
                prevBtn.classList.add(disabled);
            }
            if (requestedHeroId < 88 && nextBtn.classList.contains('disabled')) {
                nextBtn.classList.remove('disabled');
            }
        },
        /**
         * Renders panel footer with message
         * @returns {Promise}
         */
        exception = function () {
            var footerEl = document.createElement('div'),
                panelEl = document.getElementById('display');
            footerEl.classList.add('panel-footer');
            footerEl.classList.add('panel-danger');
            footerEl.textContent = 'Oh snap! Information about requested hero is broken. Please try to receive the next one';
            panelEl.appendChild(footerEl);
            setTimeout(function() {
                panelEl.removeChild(footerEl);
            }, 5000);
            return Promise.reject;
        };

    /**
     * Hero Constructor
     * @constructor
     */
    function HeroModel() {
        this.name = '';
        this.height = '0';
        this.mass = '0';
        this.hair_color = '';
        this.skin_color = '';
        this.eye_color = '';
        this.birth_year = '';
        this.gender = '';
        this.films = [];
    }

    /**
     * Hero Factory
     * @param {JSON} heroData
     * @returns {Object}
     */
    function heroModelFactory(heroData) {
        var model = new HeroModel();
        return fillObject(model, heroData);
    }

    HeroModel.factory = heroModelFactory;

    /**
     * Film Constructor
     * @constructor
     */
    function FilmModel() {
        this.title = '';
        this.episode_id = '';
    }

    /**
     * Film Factory
     * @param {JSON} filmData
     * @returns {Object}
     */
    function filmModelFactory(filmData) {
        var model = new FilmModel();
        return fillObject(model, filmData);
    }

    FilmModel.factory = filmModelFactory;

    /**
     * Produces full title for film via properties episode_id and title
     * @returns {string}
     */
    FilmModel.prototype.getFullTitle = function getFullTitle() {
        return 'Episode' + this.episode_id + ':' + this.title
    };

    /**
     * @param {string} url
     * @returns {Promise}
     */
    function getFilm(url) {
        return fetch(url)
            .then(response => {
                return response.json();
            })
            .then(filmJson => {
                var film = FilmModel.factory(filmJson);
                films.push(film);
                return Promise.resolve();
            })
    }

    /**
     * @param {number} id
     * @returns {Promise}
     */
    function loadHero(id) {
        return fetch('http://swapi.co/api/people/' + id + '/')
            .then(response => {
                return response.ok ? response.json() : Promise.reject();
            })
            .then(heroJson => {
                hero = HeroModel.factory(heroJson);
                films = [];
                return Promise.resolve(hero.films);
            }).then(films => {
                return Promise.all(films.map(filmUrl => {
                    return getFilm(filmUrl);
                }))
            }).then(() => {
                renderHero(hero);
                films.sort((prev, curr) => {
                    return prev.episode_id - curr.episode_id;
                });
                renderFilms(films.sort());
            })
            .catch(exception);
    }

    loadHero(requestedHeroId);
    nextBtn.addEventListener('click', nextHero);
    prevBtn.addEventListener('click', prevHero)
}());
