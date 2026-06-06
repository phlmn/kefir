use std::{
    env, fs, io,
    sync::{Arc, RwLock},
};

use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use lazy_static::lazy_static;
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
async fn main() {
    let cache_state: CacheState = Arc::new(RwLock::new(Cache {
        config: read_config().unwrap(),
    }));

    let app = Router::new()
        .route("/api/config", get(get_config).post(post_config))
        .route_service(
            "/{*path}",
            ServeDir::new("./public").fallback(ServeFile::new("./public/index.html")),
        )
        .with_state(cache_state);

    let host = env::var("KEFIR_HOST").unwrap_or("127.0.0.1".to_string());
    let port = env::var("KEFIR_PORT").unwrap_or("3000".to_string());

    let listener = tokio::net::TcpListener::bind(format!("{host}:{port}"))
        .await
        .unwrap();
    println!("listening on {}", listener.local_addr().unwrap());
    let _ = axum::serve(listener, app).await;
}

async fn get_config(State(cache_state): State<CacheState>) -> Json<serde_json::Value> {
    let cache_state = cache_state.read().unwrap();
    Json(cache_state.config.clone())
}

async fn post_config(
    State(cache_state): State<CacheState>,
    Json(input): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let mut cache_state = cache_state.write().unwrap();

    if let Err(_) = write_config(&input) {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    cache_state.config = input.clone();

    Ok(Json(input))
}

struct Cache {
    pub config: serde_json::Value,
}

type CacheState = Arc<RwLock<Cache>>;

lazy_static! {
    static ref CONFIG_PATH: String =
        env::var("KEFIR_CONFIG_PATH").unwrap_or("./config.json".to_string());
}

fn write_config(value: &serde_json::Value) -> io::Result<()> {
    fs::write(CONFIG_PATH.as_str(), value.to_string())
}

fn read_config() -> io::Result<serde_json::Value> {
    let content = fs::read_to_string(CONFIG_PATH.as_str())?;
    let config = serde_json::from_str(&content)?;
    Ok(config)
}
