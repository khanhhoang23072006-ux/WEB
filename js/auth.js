const Auth = {
  init() {
    if (!localStorage.getItem('brawl_users')) {
      localStorage.setItem('brawl_users', JSON.stringify([
        { id: 'u1', username: 'admin', password: '123', role: 'admin' },
        { id: 'u2', username: 'player', password: '123', role: 'user' }
      ]));
    }
  },
  
  getUsers() {
    return JSON.parse(localStorage.getItem('brawl_users')) || [];
  },
  
  getCurrentUser() {
    const u = localStorage.getItem('brawl_currentUser');
    return u ? JSON.parse(u) : null;
  },
  
  login(username, password) {
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem('brawl_currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  },
  
  register(username, password, role = 'user') {
    const users = this.getUsers();
    if (users.find(u => u.username === username)) {
      return false; // username exists
    }
    const newUser = { id: 'u' + Date.now(), username, password, role };
    users.push(newUser);
    localStorage.setItem('brawl_users', JSON.stringify(users));
    localStorage.setItem('brawl_currentUser', JSON.stringify(newUser));
    return true;
  },
  
  updateProfile(newData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) return false;

    if (newData.username && newData.username !== currentUser.username) {
      if (users.find(u => u.username === newData.username)) {
        return false;
      }
    }

    const updatedUser = { ...currentUser, ...newData };
    users[idx] = updatedUser;
    
    localStorage.setItem('brawl_users', JSON.stringify(users));
    localStorage.setItem('brawl_currentUser', JSON.stringify(updatedUser));
    return true;
  },

  logout() {
    localStorage.removeItem('brawl_currentUser');
    window.location.hash = '#/';
    window.location.reload();
  },

  isAdmin() {
    const u = this.getCurrentUser();
    return u && u.role === 'admin';
  }
};
Auth.init();
