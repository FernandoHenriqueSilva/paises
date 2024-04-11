FROM node:20.11.1
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY uploads /app/uploads
RUN chmod -R 777 /app/uploads
COPY . .
EXPOSE 3030
CMD ["node", "app.js"]