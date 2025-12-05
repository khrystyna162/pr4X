# Your environment is now fully configured to run with PostgreSQL and MongoDB.

## How to Run
1. Open your terminal in the root of the `docker-project` directory.
2. Build and start all services in detached mode by running:
   ```bash
   docker-compose up --build -d
   ```

## How to Test

Once the containers are up and running, you can use a tool like `curl` or Postman to test the new API endpoints. The server is accessible through the Nginx proxy on port 80.

### PostgreSQL API (`/api/pg/resources`)

**1. Create a new resource:**
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"name":"PostgreSQL Test", "description":"This is a test for PG"}' http://localhost/api/pg/resources
   ```

**2. Get all resources:**
   ```bash
   curl http://localhost/api/pg/resources
   ```

**3. Get a specific resource (replace `1` with an actual ID from the previous command):**
   ```bash
   curl http://localhost/api/pg/resources/1
   ```

**4. Update a resource (replace `1` with an actual ID):**
   ```bash
   curl -X PUT -H "Content-Type: application/json" -d '{"name":"Updated PG Test", "description":"Updated description"}' http://localhost/api/pg/resources/1
   ```

**5. Delete a resource (replace `1` with an actual ID):**
   ```bash
   curl -X DELETE http://localhost/api/pg/resources/1
   ```

### MongoDB API (`/api/mongo/resources`)

**1. Create a new resource:**
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"name":"MongoDB Test", "description":"This is a test for Mongo"}' http://localhost/api/mongo/resources
   ```

**2. Get all resources:**
   ```bash
   curl http://localhost/api/mongo/resources
   ```

**3. Get a specific resource (replace the ID with an actual `_id` from the previous command):**
   ```bash
   curl http://localhost/api/mongo/resources/60c72b2f9b1d8e001f8e8b82
   ```

**4. Update a resource (replace the ID with an actual `_id`):**
   ```bash
   curl -X PUT -H "Content-Type: application/json" -d '{"name":"Updated Mongo Test", "description":"Updated description"}' http://localhost/api/mongo/resources/60c72b2f9b1d8e001f8e8b82
   ```

**5. Delete a resource (replace the ID with an actual `_id`):**
   ```bash
   curl -X DELETE http://localhost/api/mongo/resources/60c72b2f9b1d8e001f8e8b82
   ```

## How to access MongoDB Admin UI

You can manage your MongoDB database using Mongo Express.
1. Open your web browser.
2. Navigate to `http://localhost:8081`.

## How to Stop
To stop all the running containers, run:
  ```bash
  docker-compose down
  ```