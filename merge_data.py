import pandas as pd
import numpy as np 
import os
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings('ignore')


pd.set_option('display.max_row', 100)
pd.set_option('display.max_columns', 50)

df_gmm_raw = pd.read_csv('./result_data/gmm_raw.csv')
df_gmm_raw.rename(inplace=True, columns={"kmeans_raw_data_label": "gmm_raw_label"})
df_gmm_raw['datetime'] = pd.to_datetime(df_gmm_raw['datetime'])
df_gmm_raw['datetime'] = df_gmm_raw['datetime'].dt.floor('min')
df_gmm_raw = df_gmm_raw[['datetime', 'gmm_raw_label', 'price']]

df_kmean_raw = pd.read_csv('./result_data/kmeans_raw.csv')
df_kmean_raw['datetime'] = pd.to_datetime(df_kmean_raw['datetime'])
df_kmean_raw['datetime'] = df_kmean_raw['datetime'].dt.floor('min')
df_kmean_raw.rename(inplace=True, columns={"kmeans_raw_data_label": "kmeans_raw_label"})
df_kmean_raw = df_kmean_raw[['datetime', 'kmeans_raw_label']]

df_kmean_image = pd.read_csv('./result_data/kmeans.csv')
df_kmean_image['datetime'] = pd.to_datetime(df_kmean_image['datetime'])
df_kmean_image['datetime'] = df_kmean_image['datetime'].dt.floor('min')
df_kmean_image.rename(inplace=True, columns={"label": "kmeans_image_label"})
df_kmean_image = df_kmean_image[['datetime', 'kmeans_image_label']]

df_gmm_image = pd.read_csv('./result_data/gmm.csv')
df_gmm_image['datetime'] = pd.to_datetime(df_gmm_image['datetime'])
df_gmm_image['datetime'] = df_gmm_image['datetime'].dt.floor('min')
df_gmm_image.rename(inplace=True, columns={"label": "gmm_image_label"})
df_gmm_image = df_gmm_image[['datetime', 'gmm_image_label']]

df = pd.merge(df_gmm_raw, df_kmean_raw, how="outer", on="datetime")
df = pd.merge(df, df_kmean_image, how="outer", on="datetime")
df = pd.merge(df, df_gmm_image, how="outer", on="datetime")
df = df.dropna()
df.to_csv("./result_data/merge.csv")