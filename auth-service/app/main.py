from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, database, security
from routers import auth as auth_router

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="MidOnline Auth Service")

app.include_router(auth_router.router)

@app.get("/")
def read_root():
    return {"service": "Auth Service is running"}