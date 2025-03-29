
### Create and use a virtual environment:
```python3 -m venv .venv```
```source .venv/bin/activate```

### Install requirements(in the backend folder):
```pip install -r requirements.txt```

### Run the app:
```uvicorn app.main:app --reload```

### Access the backend at:
* http://127.0.0.1:8000 - For the base API
* http://127.0.0.1:8000/docs - For the interactive Swagger UI documentation
* http://127.0.0.1:8000/redoc - For the ReDoc documentation
