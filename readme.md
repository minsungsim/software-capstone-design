# 인공지능을 활용한 Limit Orderbook 투자 전략

### 목적
- Orderbook 데이터의 패턴 분석
- Orderbook 데이터 패턴에 기반한 투자 전략 수립


### 내용
- Orderbook 데이터 습득 및 정제
- Orderbook의 패턴 분석
- Orderbook의 패턴을 활용한 투자전략 수립 및 백테스트


### Data Pipeline
- 데이터 습득 시스템
- AWS SAM(Serverless Application Model)
- 빌드
```
sam build
```
- 배포 
```
sam deploy -g
```

## 분석 파일
- init
```
pip install -r requirements.txt
```


### 분석 순서 [파일 실행]
1. create_data.py  => 데이터 생성 
2. kmeans_raw.ipynb => kmeans raw data version 분석 및 ./result_data/kmeans_raw.csv 생성
3. kmean_image.ipynb => kmeans image data version 분석 및 ./result_data/kmeans.csv 생성
4. gmm_raw.ipynb => gmm raw data version 분석 및 ./result_data/gmm_raw.csv 생성
5. gmm_image.ipynb => gmm image data version 분석 및 ./result_data/gmm.csv 생성
6. merge_data.py => kmeans_raw, kmeans, gmm_raw, gmm 결과물을 종합 파일로 만듦.
7. analysis.ipynb => Orderbook 클러스터 정보와 가격간의 관계 분석, 투자 전략 백테스트
8. version2_strategy.ipynb => Orderbook 클러스터의 시계열을 X로 1시간 뒤 가격을 y로 설정하여 LSTM 알고리즘을 사용하여 예측, 예측 정보를 바탕으로 analysis.ipynb 에서 수립한 전략을 강화 및 백테스트