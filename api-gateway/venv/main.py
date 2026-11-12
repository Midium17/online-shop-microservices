from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="MidOnline API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = {
    "auth": "http://localhost:8001",
    "products": "http://localhost:8002",
    "orders": "http://localhost:8003",
}

async def proxy(service: str, path: str, request: Request):
    url = f"{SERVICES[service]}/{path}"
    async with httpx.AsyncClient() as client:
        try:
            headers = dict(request.headers)
            headers.pop("host", None)
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                params=request.query_params,
                content=await request.body(),
                timeout=30.0
            )
            return Response(content=response.content, status_code=response.status_code, headers=dict(response.headers))
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail=f"Service '{service}' is offline.")

@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway_auth(path: str, request: Request): 
    return await proxy("auth", path, request)

@app.api_route("/products/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway_products(path: str, request: Request): 
    return await proxy("products", path, request)

@app.api_route("/orders/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def gateway_orders(path: str, request: Request): 
    return await proxy("orders", path, request)