FROM node:20.11.1

WORKDIR /app

COPY package*.json ./
RUN npm install

# Create the uploads directory
RUN mkdir -p uploads

# Set permissions on the uploads directory
RUN chmod -R 777 uploads

COPY . .

EXPOSE 3030
CMD ["node", "app.js"]
