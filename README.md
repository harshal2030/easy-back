# Introduction

This repository contains the backend for the app EasyTeach, which has now reached its end-of-life (EOL). I am open-sourcing it now. The app was used by over 500 users, including 25+ paid users, and included the following features:

- Real Time Chat 
- User Management
- Report Generation
- Quiz creation
- End-to-end tracking
- File upload using modules

and much more....

# Overview

This project contains two main folders:- src, tests.

- src
  - db - initiating the ORM instance
  - middlewares - used in between api routes to check auth status, check user levels etc.
  - migrations - contains database migrations
  - models - contains the database table structures (orm models)
  - services - contains code for emailing, file management and push notification
  - typings - contains custom type for the req object in express. mostly variables as passed through the middlewares
  - utils - utility functions and constants
  - routers - contains API routes and logic

- tests
  - fixtures - contains code to seed the database with initial data
  - all other files - contains unit tests for their respective modules.

Tools used in the project:
- firebase (for push notification and analytics)
- postgres (primary database)
- ffmpeg (for video processing)
- socket.io (for managing websockets)

# Running the project
There's couple of things that needs to get setup to run this project. This guide will take you through it.
## Prerequisite

In the root of the project, first run
```shell
npm install
```

Then one level outside of the root, run following commands

```shell
mkdir media/{users/{avatar,images},class/{docs,images,videos}}
mkdir keys
cd keys
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl rsa -in private.pem -pubout -out public.pem
```
Finally, download your Firebase config file from the console and paste it one level outside the root directory. Then, change the filename (for the `serviceAccount` variable) in `src/index.ts`.

## Setting env vars

First, make a folder and make some env files to make app function properly

```shell
mkdir config
touch dev.env # env variables for the development env
touch test.env # env variables for the test environment
# I would suggest to directly inject env variables using pm2 on an production environment
```

Below are the variables that needs to be defined when running the app
```
cookieSecret=secret to sign a cookie

NODE_ENV=depending upon the environment (dev|production|test)

DBurl=url to connect to postgres

key_id=obtained from razorpay (to prcoess payments)

key_secret=obtained from razorpay (to process payments)

emailHost=the host of your email service

emailPort=the port of email service

emailUser=user id of the email

emailPass=password of user provided

salt1=a salt used for hashing password

salt2= salt for hashing password

accPass=random password used in login API
```
And you're done 🎉.
Now you can finally run the project.

## Getting app running

Now, to run the project, execute the following command from root directory:
```shell
npm start
```

**Note**: The app might crash when you run the above command for the first time. Don't panic; just run the command once again. This is because the `build` folder wouldn't exist on the first run as TypeScript needs to be compiled.
