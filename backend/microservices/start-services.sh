#!/bin/bash

echo "Starting CCMMS Microservices..."

cd auth-service && npm i && npm start &
AUTH_PID=$!

cd catalog-service && npm i && npm start &
CATALOG_PID=$!

cd fulfillment-service && npm i && npm start &
FULFILLMENT_PID=$!

cd api-gateway && npm i && npm start &
GATEWAY_PID=$!

echo "All 4 microservices are running in the background."
echo "Auth: 5001 | Catalog: 5002 | Fulfillment: 5003 | Gateway: 5000"
echo "To stop them, press CTRL+C."

trap "kill $AUTH_PID $CATALOG_PID $FULFILLMENT_PID $GATEWAY_PID" SIGINT

wait
