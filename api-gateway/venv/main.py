from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="MidOnline API Gateway", version="1.0.0")

# Enable CORS for your frontend application (e.g., Vite/React on localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define port mappings for your downstream microservices
SERVICES = {
    "auth": "http://localhost:8001",
    "products": "http://localhost:8002",
    "orders": "http://localhost:8003",
}

async def proxy_request(service: str, path: str, request: Request):
    target_url = f"{SERVICES[service]}/{path}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Forward headers (dropping 'host' to avoid proxy header mismatches)
            headers = dict(request.headers)
            headers.pop("host", None)

            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                params=request.query_params,
                content=await request.body(),
            )
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=503, 
                detail=f"Microservice '{service}' is unreachable: {str(exc)}"
            )

@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway_auth(path: str, request: Request):
    return await proxy_request("auth", path, request)

@app.api_route("/products/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway_products(path: str, request: Request):
    return await proxy_request("products", path, request)

@app.api_route("/categories/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway_categories(path: str, request: Request):
    # Categories are hosted inside the product-service
    return await proxy_request("products", f"categories/{path}", request)

@app.api_route("/orders/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway_orders(path: str, request: Request):
    return await proxy_request("orders", path, request)

@app.get("/")
def gateway_root():
    return {"message": "MidOnline API Gateway is operational"}