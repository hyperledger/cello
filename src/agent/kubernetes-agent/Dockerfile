FROM python:3.6

COPY requirements.txt /
RUN pip install -r /requirements.txt
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && chmod +x kubectl && \
    mv kubectl /usr/local/bin/kubectl

COPY src /app

WORKDIR /app

ENV KUBECONFIG /app/.kube/config
ENV PYTHONPATH /app:$PATHONPATH

CMD python main.py
