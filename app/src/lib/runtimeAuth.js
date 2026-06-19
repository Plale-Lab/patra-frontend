const EMPTY_AUTH = Object.freeze({
  source: 'guest',
  user: null,
  token: '',
})

let activeAuth = EMPTY_AUTH

export function getRuntimeAuth() {
  return activeAuth
}

export function setRuntimeAuth({ source = 'guest', user = null, token = '' } = {}) {
  activeAuth = Object.freeze({
    source,
    user: user ? Object.freeze({ ...user }) : null,
    token: String(token || ''),
  })
  return activeAuth
}

export function clearRuntimeAuth() {
  activeAuth = EMPTY_AUTH
}
