/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
//LiveShare: Start
// import { SharedMap } from "fluid-framework";
// import { LiveShareClient, TestLiveShareHost } from "@microsoft/live-share";
//LiveShare: end
import { app, pages, meeting, LiveShareHost } from "@microsoft/teams-js";

const searchParams = new URL(window.location).searchParams;
const root = document.getElementById("content");

var board = null
var game = new Chess()
var $status = null
var boardMap = null

//LiveShare: Start
// LiveShare: Define container schema
// const moveSchema = { source: "", target: ""}
// const chessLiveShareSchema = {
//   move: moveSchema,
//   gameFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
//   resetRequested: false
// }
// const boardStatusKey = "board-status-key"

// const containerSchema = {
//     initialObjects: { boardMap: SharedMap },
// };

// function onContainerFirstCreated(container) {
//   boardMap = container.initialObjects.boardMap
//   boardMap.set(boardStatusKey, chessLiveShareSchema);
// }
//LiveShare: end

//LiveShare: Start
// async function joinContainer() {
//     // Are we running in teams?
//     const host = searchParams.get("inTeams")
//         ? LiveShareHost.create()
//         : TestLiveShareHost.create();

//     // Create client
//     const client = new LiveShareClient(host);

//     // Join container
//     return await client.joinContainer(containerSchema, onContainerFirstCreated);
// }
//LiveShare: end



// STARTUP LOGIC
async function start() {
    // Check for page to display
    let view = searchParams.get("view") || "stage";

    // Check if we are running on stage.
    if (searchParams.get("inTeams")) {
        // Initialize teams app
        await app.initialize();

        // Get our frameContext from context of our app in Teams
        const context = await app.getContext();
        if (context.page.frameContext == "meetingStage") {
            view = "stage";
        }
    }

    // Load the requested view
    switch (view) {
        case "content":
            renderSideBar(root);
            break;
        case "config":
            renderSettings(root);
            break;
        case "stage":
        default:
            try {
                //LiveShare: start
                // const { container } = await joinContainer();
                // boardMap = container.initialObjects.boardMap;
                //LiveShare: End
                renderStage(boardMap, root);
            } catch (error) {
                renderError(root, error);
            }
            break;
    }
}

// STAGE VIEW
const stageTemplate = document.createElement("template");

stageTemplate["innerHTML"] = `
<div class='board-container'>
<div style="background-color:#FFFFFF; margin:auto; width:100%;">
<div><p id="status"></p></div>
<div id="myBoard" style=""></div>
<div style="text-align: right">
<button id="resetBtn" style="text-align: center; font-size: 16px; margin: 4px 2px; background-color: #f44336; border: none; color: white;">Reset board</button></div>
`;

function renderStage(boardMap, elem) {
  var boardConfig = {
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop,
    moveSpeed: 'slow',
    snapbackSpeed: 300,
    snapSpeed: 100,
    position: 'start',
    showNotation: false
  }
  elem.appendChild(stageTemplate.content.cloneNode(true));  
  board = Chessboard('myBoard', boardConfig)
  $status = $('#status');
  
  $('#resetBtn').on('click', function onClick(){
        //LiveShare: Start
        // let chessLiveShareSchema = {
        //   move: {source: "", target: ""},
        //   gameFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
        //   resetRequested: true
        // }
        // boardMap.set(boardStatusKey, chessLiveShareSchema)
        //LiveShare: end
        
        //Comment below lines when liveshare is enabled to reduce rendering
        game.reset()
        board.start(false);
        updateStatus();
  });

    //LiveShare: Start
    // Live share: Get the current value of the shared data to update the view whenever it changes.
    // const boardMapUpdated = () => {
    //   const chessLiveShareSchema = boardMap.get(boardStatusKey);
    //   if( chessLiveShareSchema.resetRequested ) {
    //     game.reset()
    //     board.start(false);
    //   } else {
    //     //Update board
    //     board.position(chessLiveShareSchema.gameFen, false);
    //     //update game
    //     const moveStart = chessLiveShareSchema.move.source;
    //     const moveTarget = chessLiveShareSchema.move.target;
    //     game.move({
    //       from: moveStart,
    //       to: moveTarget,
    //       promotion: 'q' // NOTE: always promote to a queen for example simplicity
    //   })
    // }
    //   updateStatus();
    // };
    // // Use the changed event to trigger the rerender whenever the value changes.
    // boardMap.on("valueChanged", boardMapUpdated);
    //LiveShare: End
    //update current board status
    updateStatus();
    $(window).resize(board.resize)
}


// Chess board Callbacks
function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'
  //LiveShare: Start
  // if ( boardMap ) {
  //   var chessLiveShareSchema = {
  //     move: {source: source, target: target},
  //     gameFen: game.fen(),
  //     resetRequested: false
  //   }
  //   boardMap.set(boardStatusKey, chessLiveShareSchema);
  // }
  //LiveShare: End
  //Comment below line when liveshare is enabled to avoid double rendering
  updateStatus()
}

// Top View : Update Game status
function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }
  
  $status.html('Status: '+status)
  console.log('gameFen : ' + game.fen());
}


// SIDEBAR VIEW
const sideBarTemplate = document.createElement("template");

sideBarTemplate["innerHTML"] = `
  <style>
    .wrapper { text-align: center; color: green; margin-top: 2rem }
    .title { font-size: 2rem; font-weight: bolder; margin: 0}
    .text { font-size: 1.2rem; color: orange; margin: 10px 0;}
    .button { font-size: 1.2rem; color: black; margin: 0 15px; width: 90%;margin-top: 2rem; height: 40px; border: 1px solid black; border-radius: 10px; font-weight: 500}
  </style>
  <div class="wrapper">
    <p class="title">Lets Play</p>
    <p class="text">Play with your friend by clicking on the Share & Start game button </p>
    <button class="button" id="shareBtn">Share & Start Game </button>
  </div>
`;

function renderSideBar(elem) {
    elem.appendChild(sideBarTemplate.content.cloneNode(true));
    const shareToStageButton = document.getElementById("shareBtn");
    shareToStageButton.onclick = shareToStage;
    elem.appendChild(shareToStageButton);
}

function shareToStage() {
    meeting.shareAppContentToStage((error, result) => {
        if (!error) {
            console.log("Started sharing, sharedToStage result");
        } else {
            console.warn("SharingToStageError", error);
        }
    }, window.location.origin + "?inTeams=1&view=stage");
}

// SETTINGS VIEW
const settingsTemplate = document.createElement("template");

settingsTemplate["innerHTML"] = `
  <style>
    .wrapper { text-align: center; color: white }
    .title { font-size: large; font-weight: bolder; }
    .text { font-size: medium; }
  </style>
  <div class="wrapper">
    <p class="title">Welcome to Chess Meet</p>
    <p class="text">Press the save button to continue.</p>
  </div>
`;

function renderSettings(elem) {
    elem.appendChild(settingsTemplate.content.cloneNode(true));

    // Save the configurable tab
    pages.config.registerOnSaveHandler((saveEvent) => {
        pages.config.setConfig({
            websiteUrl: window.location.origin,
            contentUrl: window.location.origin + "?inTeams=1&view=content",
            entityId: "chess-meet",
            suggestedDisplayName: "Chess Meet",
        });
        saveEvent.notifySuccess();
    });

    // Enable the Save button in config dialog
    pages.config.setValidityState(true);
}

// Error view
const errorTemplate = document.createElement("template");

errorTemplate["inner" + "HTML"] = `
  <style>
    .wrapper { text-align: center; color: red }
    .error-title { font-size: large; font-weight: bolder; }
    .error-text { font-size: medium; }
  </style>
  <div class="wrapper">
    <p class="error-title">Something went wrong</p>
    <p class="error-text"></p>
    <button class="refresh"> Try again </button>
  </div>
`;

function renderError(elem, error) {
    elem.appendChild(errorTemplate.content.cloneNode(true));
    const refreshButton = elem.querySelector(".refresh");
    const errorText = elem.querySelector(".error-text");

    // Refresh the page on click
    refreshButton.onclick = () => {
        window.location.reload();
    };
    console.error(error);
    const errorTextContent = error.toString();
    errorText.textContent = errorTextContent;
}

start().catch((error) => console.error(error));