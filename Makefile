.PHONY: worker worker-run tidy

worker:
	cd worker && go build -o ../bin/gofoundry-worker .

worker-run: worker
	SANDBOX_WORKER_PORT=8081 ./bin/gofoundry-worker

tidy:
	cd worker && go mod tidy
