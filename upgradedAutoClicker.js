// ==UserScript==
// @name        [Pokeclicker] Enhanced Auto Clicker
// @namespace   Pokeclicker Scripts
// @match       https://www.pokeclicker.com/
// @grant       none
// @version     1.1.1
// @author      Bowbylone  (Original/Credit:Ephenia, Hiroa, Ivan Lay, Novie53, andrew951)
// @description Clicks through battles appropriately depending on the game state. Also, includes a toggle button to turn Auto Clicking on or off and various insightful statistics. Now also includes an automatic Gym battler as well as Auto Dungeon with different modes.
// ==/UserScript==

var clickState;
var clickColor;
var awaitAutoClick;
var autoClickerLoop;
var autoClickDPS;
var clickDPS;
var reqDPS;
var enemySpeedRaw;
var enemySpeed;
var colorDPS;
var allSelectedGym = 0;
var gymState;
var gymColor;
var gymSelect;
var dungeonState;
var dungeonColor;
var dungeonSelect;
var achievementState;
var achievementColor;
var achievementSelect;
var foundBoss = false;
var foundBossX;
var foundBossY;
var newSave;
var trainerCards;
var battleView = document.getElementsByClassName('battle-view')[0];

function initClicker() {
    if (clickState == "OFF") {
        clickColor = "danger"
        clickDPS = 0
    } else {
        clickColor = "success"
        clickDPS = +localStorage.getItem('storedClickDPS');
    }
    if (gymState == "OFF") {
        gymColor = "danger"
    } else {
        gymColor = "success"
    }
    if (dungeonState == "OFF") {
        dungeonColor = "danger"
    } else {
        dungeonColor = "success"
    }

    var elemAC = document.createElement("table");
    elemAC.innerHTML = `<tbody><tr><td colspan="4">
    <button id="auto-click-start" class="btn btn-`+ clickColor + ` btn-block" style="font-size:8pt;">
    Auto Click [`+ clickState + `]<br>
    <div id="auto-click-info">
    <div id="click-DPS">Auto Click DPS:<br><div style="font-weight:bold;color:gold;">`+ clickDPS.toLocaleString('en-US') + `</div></div>
    <div id="req-DPS">Req. DPS:<br><div style="font-weight:bold;">0</div></div>
    <div id="enemy-DPS">Enemy/s:<br><div style="font-weight:bold;color:black;">0</div></div>
    </div>
    </button></td></tr>
    <tr>
    <td style="width: 42%;">
    <button id="auto-dungeon-start" class="btn btn-block btn-`+ dungeonColor + `" style="font-size: 8pt;">
    Auto Dungeon [`+ dungeonState + `]</button>
    </td>
    <td>
  <select id="dungeon-select">
    <option value="0">F</option>
    <option value="1">B</option>
  </select>
    </td>
    <td style="width: 40%;">
    <button id="auto-gym-start" class="btn btn-block btn-`+ gymColor + `" style="font-size: 8pt;">
    Auto Gym [`+ gymState + `]
    </button>
    </td>
    <td>
  <select id="gym-select">
    <option value="0">#1</option>
    <option value="1">#2</option>
    <option value="2">#3</option>
    <option value="3">#4</option>
    <option value="4">#5</option>
    <option value="5">All</option>
  </select>
    </td>
    </tr>
    <tr>
    <td style="width: 40%;">
    <button id="auto-achievement-start" class="btn btn-block btn-`+ achievementColor + `" style="font-size: 8pt;">
    Auto Achievement [`+ achievementState + `]
    </button>
    </td>
    <td>
    <select id = "achievement-select">
        <option value = "0">Routes</option>
        <option value = "1">Dungeons</option>
    </select>
    </td>
    </tr>
    </tbody>`
    battleView.before(elemAC)
    document.getElementById('gym-select').value = gymSelect;
    document.getElementById('dungeon-select').value = dungeonSelect;
    document.getElementById('achievement-select').value = achievementSelect;

    $("#auto-click-start").click(autoClick)
    $("#auto-gym-start").click(autoGymToggle)
    $("#gym-select").change(changeSelectedGym)
    $("#auto-dungeon-start").click(autoDungeonToggle)
    $("#dungeon-select").change(changeSelectedDungeon)
    $("#auto-achievement-start").click(autoAchievementToggle)
    $("#achievement-select").change(changeSelectedAchievement)
    addGlobalStyle('#auto-click-info { display: flex;flex-direction: row;justify-content: center; }');
    addGlobalStyle('#auto-click-info > div { width: 33.3%; }');
    addGlobalStyle('#dungeonMap { padding-bottom: 9.513%; }');

    if (clickState == "ON") {
        clicker();
        calcClick();
    }
}

function autoClick() {
    if (clickState == "OFF") {
        clickState = "ON"
        document.getElementById("auto-click-start").classList.remove('btn-danger');
        document.getElementById("auto-click-start").classList.add('btn-success');
        clickDPS = +localStorage.getItem('storedClickDPS');
        clicker();
        calcClick();
    } else {
        clickState = "OFF"
        document.getElementById("auto-click-start").classList.remove('btn-success');
        document.getElementById("auto-click-start").classList.add('btn-danger');
        clickDPS = 0;
        reqDPS = 0;
        enemySpeedRaw = 0;
        clearInterval(autoClickerLoop)
        clearInterval(autoClickDPS)
    }
    localStorage.setItem("autoClickState", clickState);
    document.getElementById('auto-click-start').innerHTML = `Auto Click [` + clickState + `]<br>
    <div id="auto-click-info">
    <div id="click-DPS">Auto Click DPS:<br><div style="font-weight:bold;color:gold;">`+ clickDPS.toLocaleString('en-US') + `</div></div>
    <div id="req-DPS">Req. DPS:<br><div style="font-weight:bold;">0</div></div>
    <div id="enemy-DPS">Enemy/s:<br><div style="font-weight:bold;color:black;">0</div></div>
    </div>`
}

function autoGymToggle() {
    if (gymState == "OFF") {
        gymState = "ON"
        document.getElementById("auto-gym-start").classList.remove('btn-danger');
        document.getElementById("auto-gym-start").classList.add('btn-success');
    } else {
        gymState = "OFF"
        document.getElementById("auto-gym-start").classList.remove('btn-success');
        document.getElementById("auto-gym-start").classList.add('btn-danger');
    }
    localStorage.setItem("autoGymState", gymState);
    document.getElementById('auto-gym-start').innerHTML = `Auto Gym [` + gymState + `]`
}

function autoDungeonToggle() {
    if (dungeonState == "OFF") {
        dungeonState = "ON"
        document.getElementById("auto-dungeon-start").classList.remove('btn-danger');
        document.getElementById("auto-dungeon-start").classList.add('btn-success');
    } else {
        dungeonState = "OFF"
        document.getElementById("auto-dungeon-start").classList.remove('btn-success');
        document.getElementById("auto-dungeon-start").classList.add('btn-danger');
    }
    localStorage.setItem("autoDungeonState", dungeonState);
    document.getElementById('auto-dungeon-start').innerHTML = `Auto Dungeon [` + dungeonState + `]`
}

function autoAchievementToggle()
{
    if (achievementState == "OFF") {
        achievementState = "ON"
        document.getElementById("auto-achievement-start").classList.remove('btn-danger');
        document.getElementById("auto-achievement-start").classList.add('btn-success');
    } else {
        achievementState = "OFF"
        document.getElementById("auto-achievement-start").classList.remove('btn-success');
        document.getElementById("auto-achievement-start").classList.add('btn-danger');
    }
    localStorage.setItem("autoAchievementState", achievementState);
    document.getElementById('auto-achievement-start').innerHTML = `Auto Achievement [` + achievementState + `]`
}

function changeSelectedGym() {
    if (gymSelect != +document.getElementById('gym-select').value) {
        gymSelect = +document.getElementById('gym-select').value
        localStorage.setItem("selectedGym", gymSelect);
    }
}

function changeSelectedDungeon() {
    if (dungeonSelect != +document.getElementById('dungeon-select').value) {
        dungeonSelect = +document.getElementById('dungeon-select').value
        localStorage.setItem("selectedDungeon", dungeonSelect);
    }
}

function changeSelectedAchievement() {
    if (achievementSelect != +document.getElementById('achievement-select').value) {
        achievementSelect = +document.getElementById('achievement-select').value
        localStorage.setItem("selectedAchievement", achievementSelect);
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function calcClick() {
    autoClickDPS = setInterval(function () {
        var enemyHealth;
        try {
            enemyHealth = Battle.enemyPokemon().maxHealth();
        }
        catch (err) {
            enemyHealth = 0;
        }

        if (clickDPS != App.game.party.calculateClickAttack() * 20) {
            clickDPS = App.game.party.calculateClickAttack() * 20;
            document.getElementById('click-DPS').innerHTML = `Auto Click DPS:<br><div style="font-weight:bold;color:gold;">` + clickDPS.toLocaleString('en-US'); +`</div>`
            localStorage.setItem('storedClickDPS', clickDPS)
        }
        if (reqDPS != enemyHealth * 20) {
            reqDPS = enemyHealth * 20;
            if (clickDPS >= reqDPS) {
                colorDPS = "greenyellow"
            } else {
                colorDPS = "darkred"
            }
            document.getElementById('req-DPS').innerHTML = `Req. DPS:<br><div style="font-weight:bold;color:` + colorDPS + `">` + reqDPS.toLocaleString('en-US'); +`</div>`
        }
        if (enemySpeedRaw != ((App.game.party.calculateClickAttack() * 20) / enemyHealth).toFixed(1)) {
            enemySpeed = ((App.game.party.calculateClickAttack() * 20) / enemyHealth).toFixed(1);
            enemySpeedRaw = enemySpeed
            //console.log(enemySpeedRaw)
            if (enemySpeedRaw == 'Infinity') {
                enemySpeed = 0
            }
            if (enemySpeedRaw >= 20 && enemySpeedRaw != 'Infinity') {
                enemySpeed = 20
            }
            document.getElementById('enemy-DPS').innerHTML = `Enemy/s:<br><div style="font-weight:bold;color:black;">` + enemySpeed + `</div>`
        }
    }, 1000);
}

function clicker() {
    autoClickerLoop = setInterval(function () {
        // Click while in a normal battle
        if (App.game.gameState == GameConstants.GameState.fighting) {
            Battle.clickAttack();
        }

        //Auto Gym checking
        if (gymState == "ON") {
            autoGym();
        }

        //Auto Dungeon checking
        if (dungeonState == "ON" && DungeonRunner.fighting() == false && DungeonBattle.catching() == false) {
            autoDungeon();
        }
        //Reset the values for the boss coordinates if we timeout or turn off autoDungeon
        if ((dungeonState == "OFF" && foundBoss) || (dungeonState == "ON" && DungeonRunner.dungeonFinished() && foundBoss)){
            foundBoss = false
            bossCoords.length = 0
        }

        //Auto Achievement checking
        if(achievementState == "ON") /*&& DungeonRunner.fighting() == false && DungeonBattle.catching() == false*/
        {
            autoAchievement();
        }

        // Click while in a gym battle
        if (App.game.gameState === GameConstants.GameState.gym) {
            GymBattle.clickAttack();
        }

        // Click while in a dungeon - will also interact with non-battle tiles (e.g. chests)
        if (App.game.gameState === GameConstants.GameState.dungeon) {
            if (DungeonRunner.fighting() && !DungeonBattle.catching()) {
                DungeonBattle.clickAttack();
            }
        }
    }, 50); // The app hard-caps click attacks at 50
}

function autoGym() {
    if (player.town().content.length != 0) {
        //Might break in some towns, needs more testing
        if (player.town().content[0] instanceof Gym) {
            if (MapHelper.calculateTownCssClass(player.town().name) != "currentLocation") {
                MapHelper.moveToTown(player.town().name)
            }
            /*Don't think this can ever happen
            if (player.region != player.town().region) {
                player.region = player.town().region
            }*/

            if (App.game.gameState != GameConstants.GameState.gym) {
                //Checking if Champion exists here and is unlocked
                let champUnlocked;
                try {champUnlocked = player.town().content[4].isUnlocked()} catch (err) { champUnlocked = false }
                //If "All" is selected and the Champion is unlocked, then go through list of league fully from 0-4
                if (gymSelect === 5 && champUnlocked) {
                    GymRunner.startGym(player.town().content[allSelectedGym])
                    allSelectedGym++
                    if(allSelectedGym === 5) {
                        allSelectedGym = 0
                    }
                } else {
                    //If the content is a Gym or league champion and we unlocked it we fight
                    if ((player.town().content[gymSelect] instanceof Gym && player.town().content[gymSelect].isUnlocked()) || (player.town().content[gymSelect] instanceof Champion && player.town().content[gymSelect].isUnlocked())){
                        GymRunner.startGym(player.town().content[gymSelect])
                    }
                    else {
                        //Otherwise we try to fight the previous gyms (elite 4)
                        for (var i = player.town().content.length - 1; i >= 0; i--){
                            if ((player.town().content[i] instanceof Gym && player.town().content[i].isUnlocked()) || (player.town().content[i] instanceof Champion && player.town().content[i].isUnlocked())){
                                GymRunner.startGym(player.town().content[i])
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}

var bossCoords = []

function autoDungeon() {
    //Rewrite
    if (player.town().hasOwnProperty("dungeon") == true && player.town().dungeon !== undefined) {
        var getTokens = App.game.wallet.currencies[GameConstants.Currency.dungeonToken]();
        var dungeonCost = player.town().dungeon.tokenCost;
        if (MapHelper.calculateTownCssClass(player.town().name) != "currentLocation") {
            MapHelper.moveToTown(player.town().name)
        }
        //Don't think this condition is ever possible
        /*if (player.region != player.town().region) {
            player.region = player.town().region
        }*/
        if (getTokens >= dungeonCost && App.game.gameState != GameConstants.GameState.dungeon) {
            DungeonRunner.initializeDungeon(player.town().dungeon)
        }

        if (App.game.gameState === GameConstants.GameState.dungeon) {
            var dungeonBoard = DungeonRunner.map.board();
            //The boss can be found at any time
            if (foundBoss == false){
                bossCoords = scan(dungeonBoard)
            }
            //Wander around until we can move to the boss tile
            //Pathfinding should be implemented here, A* looks like the best algorithm
            else if (foundBoss == true && dungeonSelect == 1){
                wander(dungeonBoard, bossCoords)
            }
            else if (dungeonSelect == 0){
                fullClear(dungeonBoard, bossCoords)
            }
        }
    }
}

function scan(dungeonBoard){
    /*var bossCoords = []
    var playerCoords = []*/
    for (var i = 0; i < dungeonBoard.length; i++){
        for (var j = 0; j<dungeonBoard[i].length; j++){
            if (dungeonBoard[i][j].type() == GameConstants.DungeonTile.boss){
                foundBoss = true
                return [i, j]
            }
            //Required for pathfinding, if ever implemented
            /*if (dungeonBoard[i][j].hasPlayer == true){
                playerCoords = [i, j]
            }*/
        }
    }
}

function wander(dungeonBoard, bossCoords){
    var moves = []
    //Attempt to move to the boss if the coordinates are within movable range
    DungeonRunner.map.moveToCoordinates(bossCoords[1], bossCoords[0])
    if (DungeonRunner.map.currentTile().type() == GameConstants.DungeonTile.boss){
        foundBoss = false
        bossCoords.length = 0
        DungeonRunner.startBossFight()
    }
    //Iterates through the board and compiles all possible moves
    for (var i = 0; i < dungeonBoard.length; i++){
        for (var j = 0; j < dungeonBoard[i].length; j++){
            //The entrance doesn't count as visited on first entering a dungeon so this OR is required
            if (dungeonBoard[i][j].isVisited == true || dungeonBoard[i][j].type() == GameConstants.DungeonTile.entrance){
                //This is required because if the column doesn't exist it throws an attribute of undefined error
                if (dungeonBoard[i+1] != undefined){
                    if (dungeonBoard[i+1][j] != undefined){
                        if (dungeonBoard[i+1][j].isVisited == false) moves.push([i+1, j])
                    }
                }
                if (dungeonBoard[i-1] != undefined){
                    if (dungeonBoard[i-1][j] != undefined){
                        if (dungeonBoard[i-1][j].isVisited == false) moves.push([i-1, j])
                    }
                }
                if (dungeonBoard[i][j+1] != undefined){
                    if (dungeonBoard[i][j+1].isVisited == false) moves.push([i, j+1])
                }
                if (dungeonBoard[i][j-1] != undefined){
                    if (dungeonBoard[i][j-1].isVisited == false) moves.push([i, j-1])
                }
            }
        }
    }
    //Select a random move from compiled list of possible ones
    var moveTo = moves[getRandomInt(moves.length)]
    //Coordinates saved in couples of [y, x] so we swap them when we want to move
    DungeonRunner.map.moveToCoordinates(moveTo[1], moveTo[0])
    //Reset moves array
    moves.length = 0
}

function fullClear(dungeonBoard, bossCoords){
    //Get number of invisible tiles, if 0 we have the map
    var invisTile = document.getElementById('dungeonMap').querySelectorAll('.tile-invisible').length;
    //Chests
    var getChests = document.getElementById('dungeonMap').querySelectorAll('.tile-chest').length;
    //Enemies
    var getEnemy = document.getElementById('dungeonMap').querySelectorAll('.tile-enemy').length;

    for (var i = 0; i < dungeonBoard.length; i++){
        for (var j = 0; j<dungeonBoard[i].length; j++){
            //Basically just attempts to move to all tiles that aren't cleared
            if (dungeonBoard[i][j].isVisited == false){
                DungeonRunner.map.moveToCoordinates(j, i)
            }

            if (DungeonRunner.map.currentTile().type() == GameConstants.DungeonTile.chest){
                DungeonRunner.openChest()
            }
        }
    }
    //If we cleared the entire floor, move to the boss room and start the fight
    if (invisTile == 0 && getChests == 0 && getEnemy == 0 && foundBoss == true){
        DungeonRunner.map.moveToCoordinates(bossCoords[1], bossCoords[0])
        foundBoss = false
        bossCoords.length = 0
        DungeonRunner.startBossFight()
    }
}

function autoAchievement()
{
    
    let currentRoute = player.route();
    let currentRegion = player.region;
    let currentDungeon = player.town().dungeon.name;
    //Route
    if(achievementSelect == 0)
    {
        let newRoute = getNextRoute();
        currentRoute = player.route();
        if(newRoute && newRoute.number != currentRoute || newRoute.region != currentRegion)
        {   
            currentRoute = newRoute.number;
            currentRegion = newRoute.region;
            //Alola Handler
            if(newRoute.region === GameConstants.Region.alola)
            {
                player.subregion = newRoute.subRegion;
            }
            MapHelper.moveToRoute(newRoute.number, newRoute.region);
        }
    }
    //Gym
    /*
    else if(achievementSelect == 1)
    {
        document.getElementById('auto-achievement-start').innerHTML = `gym 2 [` + achievementState + `]`
    }*/
    
    //Dungeon
    else if(achievementSelect == 1)
    {
        //Toggle Auto Dungeon ON
        if (dungeonState == "OFF") {
            dungeonState = "ON"
            document.getElementById("auto-dungeon-start").classList.remove('btn-danger');
            document.getElementById("auto-dungeon-start").classList.add('btn-success');
            document.getElementById("auto-dungeon-start").innerHTML = `Auto Dungeon [` + dungeonState + `]`;

        }

        //Move
        let newDungeon = getNextDungeon();
        if(newDungeon && newDungeon != currentDungeon)
        {
            autoDungeonToggle();
            currentDungeon = newDungeon;
            currentRegion = player.region;
            MapHelper.moveToTown(newDungeon);
        }
    }
    //All
    /*
    else if(achievementSelect == 3)
    {
        document.getElementById('auto-achievement-start').innerHTML = `all 2 [` + achievementState + `]`
    }*/
}

function getNextRoute()
{
    for(let i = 0; i <= player.highestRegion(); i ++)
    {
        player.region = i;
        let regionRoutes = Routes.getRoutesByRegion(i);
        for(let j = 0; j < regionRoutes.length; j ++)
        {
            if(getDefeatedOnRoute(i, regionRoutes[j].number) < 10000)
            {
                return regionRoutes[j];
            }
        }
    }
}

function getNextDungeon()
{
    for(let i = 0; i <= player.highestRegion(); i ++)
    {
        player.region = i;
        let regionDungeons = GameConstants.RegionDungeons[i];
        for(let j = 0; j < regionDungeons.length; j ++)
        {
            let defeated = getDefeatedOnDungeon(regionDungeons[j]);

            if(getDefeatedOnDungeon(regionDungeons[j]) < 500)
            {
                return regionDungeons[j];
            }
        }
    }
}

function getDefeatedOnRoute(region, route)
{
    return App.game.statistics.routeKills[region][route]();
}

function getDefeatedOnDungeon(dungeonName)
{
    return App.game.statistics.dungeonsCleared[GameConstants.getDungeonIndex(dungeonName)]();
}

if (localStorage.getItem('autoClickState') == null) {
    localStorage.setItem("autoClickState", "OFF");
}
if (localStorage.getItem('storedClickDPS') == null) {
    localStorage.setItem("storedClickDPS", 0);
}
if (localStorage.getItem('autoGymState') == null) {
    localStorage.setItem("autoGymState", "OFF");
}
if (localStorage.getItem('selectedGym') == null) {
    localStorage.setItem("selectedGym", 0);
}
if (localStorage.getItem('autoDungeonState') == null) {
    localStorage.setItem("autoDungeonState", "OFF");
}
if (localStorage.getItem('selectedDungeon') == null) {
    localStorage.setItem("selectedDungeon", 0);
}
if(localStorage.getItem('autoAchievementState') == null)
{
    localStorage.setItem("autoAchievementState", "OFF")
}
if (localStorage.getItem('selectedAchievement') == null) 
{
    localStorage.setItem("selectedAchievement", 0);
}

clickState = localStorage.getItem('autoClickState');
gymState = localStorage.getItem('autoGymState');
gymSelect = +localStorage.getItem('selectedGym');
dungeonState = localStorage.getItem('autoDungeonState');
dungeonSelect = localStorage.getItem('selectedDungeon');
achievementState = localStorage.getItem('autoAchievementState');
achievementSelect = localStorage.getItem('selectedAchievement');

function loadScript(){
    var oldInit = Preload.hideSplashScreen

    Preload.hideSplashScreen = function(){
        var result = oldInit.apply(this, arguments)
        initClicker()
        return result
    }
}

var scriptName = 'upgradedAutoClicker'

if (document.getElementById('scriptHandler') != undefined){
    var scriptElement = document.createElement('div')
    scriptElement.id = scriptName
    document.getElementById('scriptHandler').appendChild(scriptElement)
    if (localStorage.getItem(scriptName) != null){
        if (localStorage.getItem(scriptName) == 'true'){
            loadScript()
        }
    }
    else{
        localStorage.setItem(scriptName, 'true')
        loadScript()
    }
}
else{
    loadScript();
}

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}
