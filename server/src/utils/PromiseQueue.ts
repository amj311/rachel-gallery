import { wait } from "./miscUtils";

/**
 * Represents a queued task with its cost metric.
 */
interface QueuedTask<T> {
    cost?: number;
    taskFn: () => Promise<T>;
}

export class PromiseQueue {
    // Store tasks wrapped with their cost
    private queue: Array<QueuedTask<any>> = [];
    
    // Total cost consumed by currently running tasks
    private activeCost: number = 0; 
	private maxCost: number = 0;
	private concurrencyLimit: number = 1;

    constructor(
        private readonly props: {
            /** Maximum total cost that can run concurrently (e.g., max 5 units of CPU load). */
            maxCost?: number; 
            /** Maximum number of active workers, even if cost allows more. */
            concurrencyLimit?: number; 
            beforeEach?: () => void;
            minInterval?: number;
        } = {}
    ) {
        // Basic validation
        this.maxCost = props.maxCost || 0;
        this.concurrencyLimit = Math.max(1, props.concurrencyLimit || 1);
    }

    get size(): number {
        return this.queue.length;
    }

    /**
     * Adds a task to the queue, specifying its resource cost.
     * @param cost The resource cost of the task.
     * @param promiseFn The function returning the Promise.
     * @returns A Promise that resolves when this specific task is completed.
     */
    public add<T>(cost: number, promiseFn: () => Promise<T>): Promise<T> {
        const task: QueuedTask<T> = { cost, taskFn: promiseFn };
        this.queue.push(task);
        console.log(`[➕] Task added with cost ${cost}. Queue size: ${this.queue.length}`);

        // If the queue was empty before adding this item, start the worker pool.
        if (this.queue.length === 1) {
            this.processQueue();
        }
        // Note: The worker pool will handle the actual execution start.
        return new Promise<T>((resolve, reject) => {
            // We wrap the promise to capture the resolution/rejection correctly
            // even though the worker starts it later.
            task.taskFn().then(resolve).catch(reject);
        });
    }

    /**
     * The core worker function. It continuously tries to pull and run tasks
     * until the queue is empty.
     * @param workerId A unique identifier for logging purposes.
     */
    private async worker(workerId: number): Promise<void> {
        while (this.queue.length > 0) {
            let taskToRun: QueuedTask<any> | null = null;
            let startIndex = 0;

            // 1. Search for a runnable task (Cost Check)
            // Find the first task in the queue whose cost fits the remaining bandwidth.
            for (let i = 0; i < this.queue.length; i++) {
                const task = this.queue[i];
                if (this.activeCost + (task.cost || 0) <= this.maxCost) {
                    // Found a runnable task
                    taskToRun = task;
                    startIndex = i;
                    break;
                }
            }

            // If no task can be run (due to cost, or queue empty)
            if (!taskToRun) {
                console.log(`[Worker ${workerId}] Waiting for cost capacity. Active Cost: ${this.activeCost}/${this.maxCost}. Queue size: ${this.queue.length}`);
                
                // Wait for a short interval and then continue the loop to re-check costs.
                await wait(100); 
                continue; 
            }
            
            // 2. Dequeue the task (splice removes and returns the element at startIndex)
            taskToRun = this.queue.splice(startIndex, 1)[0];
            const taskCost = taskToRun.cost || 0;

            console.log(`\n[Worker ${workerId}] Pulling task (Cost: ${taskCost}). Active Cost: ${this.activeCost} -> ${this.activeCost + taskCost}`);

            try {
                // 3. Update State (Cost)
                this.activeCost += taskCost || 0;
                
                // 4. Execute the task
                if (this.props.beforeEach) {
                    await this.props.beforeEach();
                }
                
                await taskToRun.taskFn();
                console.log(`[Worker ${workerId} SUCCESS] Task completed. Active Cost remaining: ${this.activeCost - taskCost}`);

            } catch (error) {
                console.error(`[Worker ${workerId} ERROR] Task failed. Active Cost remains ${this.activeCost}.`, error);
            } finally {
                // 5. Reset State (Cost)
                this.activeCost -= taskCost || 0;
            }
            
            // 6. Wait interval after completion
            if (this.props.minInterval) {
                await wait(this.props.minInterval);
            }
        }
    }

    /**
     * Starts the worker pool (N workers) which will process the queue based on cost constraints.
     */
    private processQueue() {
        // We create N workers (N = concurrencyLimit)
        const workers: Promise<void>[] = [];
        for (let i = 1; i <= this.concurrencyLimit; i++) {
            workers.push(this.worker(i));
        }

        // Wait for all workers to finish (i.e., the queue becomes empty)
        Promise.all(workers);
    }
}
