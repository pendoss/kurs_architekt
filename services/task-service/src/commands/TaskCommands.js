const { v4: uuidv4 } = require('uuid');

class CreateTaskCommand {
  constructor(name, description) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
    this.timestamp = new Date().toISOString();
  }
}

class UpdateTaskCommand {
  constructor(id, name, description, status) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.status = status;
    this.timestamp = new Date().toISOString();
  }
}

class DeleteTaskCommand {
  constructor(id) {
    this.id = id;
    this.timestamp = new Date().toISOString();
  }
}

module.exports = {
  CreateTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand
};
