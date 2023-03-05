let rows = 3; // rows*cols must be even
let cols = 4;

const DIFFCONFIG = 
{
    beginner: {rows: 3, cols: 4},
    intermediate: {rows: 4, cols: 5},
    advanced: {rows: 4, cols: 7},
    expert: {rows: 4, cols: 9}
};

let difficulty = localStorage.getItem('difficulty');

const TIME_SHOWN = 1000; // ms

//const BACK_IMG = 'https://opengameart.org/sites/default/files/card%20back%20red.png';
const BACK_IMG = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwUj__NyM09uRckJrCgJsYcKIMbXYWX_glyQ&usqp=CAU';

let timeStart; // ms
let timePlayed; // sec

const petition = async function(url, config) 
{
    const response = await fetch(url, config);
    return await response.json();
}

let cards = [];
let correct = [];
let guesses = [];
let deckId = '';
let canClick = false, playing = false;

const btnNewGame = document.getElementById('btnNewGame');
const tableCards = document.getElementById('tableCards');
const selDifficulty = document.getElementById('selDifficulty');
const txtTime = document.getElementById('txtTime');
const txtBest = document.getElementById('txtBest');
if(difficulty) selDifficulty.value = difficulty;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function checkCorrect()
{
    const guessedCards = cards.filter(card => card.guess);
    if(guessedCards.length > 2)
    {
        for(let i = 0; i < guessedCards.length; i++)
        {
            guessedCards[i].guess = false;
            updateCardImage(cards.indexOf(guessedCards[i]));
        }
    }
    if(guessedCards.length === 2)
    {
        if(guessedCards[0].value === guessedCards[1].value)
        {
            guessedCards[0].correct = true;
            guessedCards[1].correct = true;
        }
        else
        {
            canClick = false;
            await sleep(TIME_SHOWN);
            canClick = true;
        }
        guessedCards[0].guess = false;
        guessedCards[1].guess = false;
        updateCardImage(cards.indexOf(guessedCards[0]));
        updateCardImage(cards.indexOf(guessedCards[1]));
    }
    
    const correctCards = cards.filter(card => card.correct);
    if(correctCards.length === cards.length) // game finished
    {
        playing = false;
        canClick = false;
        await sleep(500);

        const prevBest = localStorage.getItem(difficulty + 'BestTime');
        if(!prevBest || prevBest > timePlayed)
        {
            localStorage.setItem(difficulty + 'BestTime', timePlayed);
        }
        
        // animación final - NO FUNCIONA
        const cardImages = document.getElementsByClassName('divFront');
        for(let i = 0; i < cardImages.length; i++)
            cardImages[i].classList.add('zoomOut');
        await sleep(1000);
        newGame();
    }
}

async function cardClicked(id)
{
    if(canClick)
    {
        const index = parseInt(id.substring(4));
        const card = cards[index];
        if(!card.correct)
        { 
            card.guess = true;
            updateCardImage(index);
            checkCorrect();
        }
    }
}
 
const newGame = async function()
{
    playing = false;
    canClick = false;

    timeStart = new Date().getTime();
    updateTxtTime();

    difficulty = selDifficulty.value;
    localStorage.setItem('difficulty', difficulty);
    rows = DIFFCONFIG[difficulty].rows;
    cols = DIFFCONFIG[difficulty].cols;

    // new deck
    const json = await petition('https://deckofcardsapi.com/api/deck/new/shuffle/', 
    {
        method: 'GET',
        mode: 'cors'
    });
    deckId = json.deck_id;

    // get random cards
    let cardsData = (await petition('https://deckofcardsapi.com/api/deck/' + deckId + '/draw/?count=' + (rows*cols/2), 
    {
        method: 'GET',
        mode: 'cors'
    })).cards;
    // duplicate them
    cardsData = await cardsData.concat(await cardsData);
    // and shuffle
    shuffleArray(cardsData);

    // make custom card objects
    cards = [];
    for(let i = 0; i < cardsData.length; i++)
    {
        cards.push({
            image: cardsData[i].image,
            value: cardsData[i].code,
            index: i,
            correct: false,
            guess: true
        });
    }

    // add to html
    tableCards.innerHTML = '';
    for(let row = 0; row < rows; row++)
    {
        let trCards = document.createElement('tr');
        for(let col = 0; col < cols; col++)
        {
            let tdCard = document.createElement('td');
            let divCard = document.createElement('div');
            let divFront = document.createElement('div');
            let divBack = document.createElement('div');
            let imgFront = document.createElement('img');
            let imgBack = document.createElement('img');
            divFront.id = 'frnt' + getIndex(row, col);
            divFront.classList.add('divFront');
            divBack.id = 'back' + getIndex(row, col);
            divBack.classList.add('divBack');
            imgFront.src = cards[getIndex(row, col)].image;
            imgFront.width = 120;
            imgFront.alt = cards[getIndex(row, col)].value;
            imgFront.id = 'imgFront' + getIndex(row, col);
            imgFront.classList.add('imgFront');
            imgBack.classList.add('imgBack');
            imgBack.src = BACK_IMG;
            imgBack.width = 120;
            imgBack.alt = 'card';
            imgBack.id = 'imgBack' + getIndex(row, col);
            divCard.id = 'card' + getIndex(row, col);
            divFront.setAttribute("onclick", "cardClicked(this.id);");
            divBack.setAttribute("onclick", "cardClicked(this.id);");
            divFront.appendChild(imgFront);
            divBack.appendChild(imgBack);
            divCard.appendChild(divFront);
            divCard.appendChild(divBack);
            divCard.classList.add('card');
            tdCard.innerHTML = divCard.outerHTML;
            trCards.appendChild(tdCard);
        }
        tableCards.innerHTML += trCards.outerHTML;
    }

    updateTxtBest();

    await sleep(3000);
    for(let i = 0; i < cards.length; i++)
    {
        cards[i].guess = false;
        updateCardImage(i);
    }
    timeStart = new Date().getTime();
    canClick = true;
    playing = true;

    while(playing)
    {
        await sleep(200);
        updateTxtTime();
    }
};

newGame();
btnNewGame.onclick = newGame;

function shuffleArray(array) 
{
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function getIndex(row, col)
{
    return row * cols + col;
}

function getCardImage(index)
{
    let card = cards[index];
    if(card.correct || card.guess)
        return card.image;
    else
        return BACK_IMG;
}

function updateCardImage(index)
{
    let divFront = document.getElementById('frnt' + index);
    let divBack = document.getElementById('back' + index);
    if(cards[index].correct || cards[index].guess)
    {
        divFront.style.rotate = "y 0deg";
        divBack.style.rotate = "y 180deg";
    }
    else
    {
        divFront.style.rotate = "y 180deg";
        divBack.style.rotate = "y 0deg";
    }
}

function updateTxtTime()
{
    timePlayed = Math.floor((new Date().getTime() - timeStart) / 1000);
    txtTime.textContent = timePlayed;
}

function updateTxtBest()
{
    const bestTime = localStorage.getItem(difficulty + 'BestTime');
    if(bestTime)
        txtBest.textContent = bestTime;
    else
        txtBest.textContent = '—';
}