use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

/// This is a made-up example of what a response structure may look like.
/// There is no restriction on what it can be. The runtime requires responses
/// to be serialized into json. The runtime pays no attention
/// to the contents of the response payload.
#[derive(Serialize, Deserialize)]
struct Response {
    id: String,
    version: String,
}

/// This is the main body for the function.
/// Write your code inside it.
/// There are some code example in the following URLs:
/// - https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples
/// - https://github.com/aws-samples/serverless-rust-demo/
async fn function_handler(event: LambdaEvent<Value>) -> Result<Value, Error> {
    // Extract some useful info from the request
    // let command = event.payload.command;

    let field_name = event.payload["info"]["fieldName"].to_owned();

    let response = Response {
        id: String::from("1"),
        version: String::from("version"),
    };

    if field_name == json!("addDemo") {
        return Ok(json!(response))
    }

    // Prepare the response
    let resp = json!(vec![response]);

    // Return `Response` (it will be serialized to JSON automatically by the runtime)
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    run(service_fn(function_handler)).await
}
