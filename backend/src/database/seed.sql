INSERT INTO owners (username, password_hash)
VALUES ('owner', '$2b$10$xAl/fNPF0BF2fzoecZfKx.OcZQ/4wslhUFo.W3EpuzukAjE62Djs2');

-- login 
node -e "require('bcryptjs').hash('Owner@12345', 10).then(console.log)"