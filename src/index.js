const express = require("express");
const cors = require("cors");

const { v4: uuidv4, validate } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  // Complete aqui

  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response
      .status(404)
      .json({ error: "Erro na requisição, o usuário informado não existe !" });
  }

  request.user = user;

  next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  // Complete aqui

  const { user } = request;

  if (user.pro === false && user.todos.length >= 10) {
    return response.status(403).json({
      error:
        "Para efetuar a criação de mais de 10 tarefas, por favor assine o plano pro",
    });
  }

  if (user.pro) {
    next();
  }

  next();
}

function checksTodoExists(request, response, next) {
  // Complete aqui

  const { username } = request.headers;
  const { id } = request.params;

  const validId = validate(id);

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response
      .status(400)
      .json({ error: "O usuário informado não é válido" });
  }

  if (validId === false) {
    return response
      .status(400)
      .json({ error: "O id inserido é um Id inválido" });
  }

  const searchId = username.todos.includes(id);

  if (searchId === false) {
    return response
      .status(400)
      .json({ error: "O usuário não possui uma tarefa com o Id informado" });
  }
}

function findUserById(request, response, next) {
  // Complete aqui

  const { id } = request.params;

  const userId = users.find((user) => user.id === id);

  const usersids = users.map((x) => x.id);

  if (usersids.includes(id) === false) {
    return response
      .status(404)
      .json({ error: "Erro na requisição, o usuário informado não existe" });
  }

  if (!id) {
    return response
      .status(404)
      .json({ error: "Erro na requisição, o usuário informado não existe" });
  }

  request.user = userId;

  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: "Username already exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/users/:id", findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch("/users/:id/pro", findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response
      .status(400)
      .json({ error: "Pro plan is already activated." });
  }

  user.pro = true;

  return response.json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post(
  "/todos",
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  (request, response) => {
    const { title, deadline } = request.body;
    const { user } = request;

    const newTodo = {
      id: uuidv4(),
      title,
      deadline: new Date(deadline),
      done: false,
      created_at: new Date(),
    };

    user.todos.push(newTodo);

    return response.status(201).json(newTodo);
  }
);

app.put("/todos/:id", checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch("/todos/:id/done", checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksTodoExists,
  (request, response) => {
    const { user, todo } = request;

    const todoIndex = user.todos.indexOf(todo);

    if (todoIndex === -1) {
      return response.status(404).json({ error: "Todo not found" });
    }

    user.todos.splice(todoIndex, 1);

    return response.status(204).send();
  }
);

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById,
};
