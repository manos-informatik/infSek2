(function () {
  "use strict";

  var STORAGE_KEY = "datenmanagement.progress.v1";
  var storageAvailable = detectStorage();
  var state = loadState();

  function detectStorage() {
    try {
      var probeKey = STORAGE_KEY + ".probe";
      window.localStorage.setItem(probeKey, "1");
      window.localStorage.removeItem(probeKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function defaultState() {
    return {
      topics: {}
    };
  }

  function defaultTaskState() {
    return {
      response: null,
      attempted: false,
      checked: false,
      correct: false,
      confidence: "",
      hintLevel: 0,
      modelShown: false,
      lastOutcome: null,
      message: ""
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureShape(rawState) {
    var nextState = rawState && typeof rawState === "object" ? rawState : defaultState();
    if (!nextState.topics || typeof nextState.topics !== "object") {
      nextState.topics = {};
    }
    return nextState;
  }

  function loadState() {
    if (!storageAvailable) {
      return defaultState();
    }

    try {
      return ensureShape(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (error) {
      return defaultState();
    }
  }

  function saveState() {
    if (!storageAvailable) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getTopicBucket(topic) {
    if (!state.topics[topic]) {
      state.topics[topic] = { tasks: {} };
    }
    if (!state.topics[topic].tasks || typeof state.topics[topic].tasks !== "object") {
      state.topics[topic].tasks = {};
    }
    return state.topics[topic];
  }

  function getTaskState(topic, taskId) {
    var topicBucket = getTopicBucket(topic);
    var storedTask = topicBucket.tasks[taskId];
    return clone(Object.assign(defaultTaskState(), storedTask || {}));
  }

  function updateTask(topic, taskId, updates) {
    var topicBucket = getTopicBucket(topic);
    var currentTask = getTaskState(topic, taskId);
    topicBucket.tasks[taskId] = Object.assign({}, currentTask, updates || {});
    saveState();
    return clone(topicBucket.tasks[taskId]);
  }

  function getAllTaskStates(topic) {
    return clone(getTopicBucket(topic).tasks);
  }

  function resetTopic(topic) {
    state.topics[topic] = { tasks: {} };
    saveState();
  }

  window.DataManagementStorage = {
    available: storageAvailable,
    defaultTaskState: defaultTaskState,
    getState: function () {
      return clone(state);
    },
    getTaskState: getTaskState,
    getAllTaskStates: getAllTaskStates,
    updateTask: updateTask,
    resetTopic: resetTopic
  };
})();