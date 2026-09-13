from fastapi import FastAPI

app = FastAPI(
    title="SIAS Analysis API",
    description="Serviço de análise de monografias",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "SIAS Analysis API running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }