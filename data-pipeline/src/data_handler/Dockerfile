# Use the official AWS Lambda base image
FROM public.ecr.aws/lambda/nodejs:14

# Set the working directory to /var/task to match Lambda's execution environment
WORKDIR /var/task

# Copy your Lambda function code and dependencies to the container
COPY . ./


# Install npm dependencies (if needed)
RUN npm install

# Define the Lambda function's handler (change to your function's handler)
CMD ["index.getData"]