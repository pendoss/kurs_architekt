class TaskCreatedEvent {
  constructor(aggregateId, name, description) {
    this.aggregateId = aggregateId;
    this.name = name;
    this.description = description;
    this.eventType = 'TaskCreated';
    this.timestamp = new Date().toISOString();
  }
}

class TaskUpdatedEvent {
  constructor(aggregateId, name, description, status) {
    this.aggregateId = aggregateId;
    this.name = name;
    this.description = description;
    this.status = status;
    this.eventType = 'TaskUpdated';
    this.timestamp = new Date().toISOString();
  }
}

class TaskDeletedEvent {
  constructor(aggregateId) {
    this.aggregateId = aggregateId;
    this.eventType = 'TaskDeleted';
    this.timestamp = new Date().toISOString();
  }
}

module.exports = {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskDeletedEvent
};
