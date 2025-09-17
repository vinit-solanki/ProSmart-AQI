---
title: ProSmart AQI Forecasting
emoji: 🌍
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# 🌍 ProSmart AQI Forecasting System

Real-time Air Quality Index forecasting using advanced machine learning models.

## Features

- 🤖 **Advanced ML Models**: Prophet + Regression models for accurate predictions
- 📊 **Multiple Parameters**: NO₂, O₃, PM10, PM2.5, CO, SO₂, Temperature
- 🔄 **Auto-Updates**: Forecasting runs every 30 minutes
- 🌐 **Web API**: RESTful endpoints for easy integration
- 📈 **48-Hour Forecasts**: Extended prediction horizon

## API Endpoints

- `GET /` - Server status and information
- `GET /status` - Detailed system status
- `GET /trigger` - Manually trigger forecasting
- `GET /logs` - View recent logs

## Usage

The system automatically generates air quality predictions every 30 minutes and provides real-time access via web API.