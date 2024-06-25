import pandas as pd
import numpy as np 
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import os
from PIL import Image


def get_dates_between(start_date, end_date):
    start_datetime = datetime.strptime(start_date, "%Y-%m-%d %H")
    end_datetime = datetime.strptime(end_date, "%Y-%m-%d %H")
    
    dates_list = []
    current_datetime = start_datetime
    while current_datetime <= end_datetime:
        dates_list.append((current_datetime.strftime("%Y-%m-%d"), current_datetime.strftime("%H")))
        current_datetime += timedelta(hours=1)

    return dates_list 

def create_sorted_list(start, end, interval):
    result = []
    current_value = start
    while current_value <= end:
        result.append(round(current_value, 1))  # 값의 소수점을 첫 번째 자리까지 반올림
        current_value = round(current_value + interval, 1)  # 간격 값도 소수점을 첫 번째 자리까지 반올림
    return result

def set_level(n):
    is_minus = False

    if n < 0:
        is_minus = True    

    n = abs(n)
    level = 0
    if n >= 40:
        level = 7
    elif 30 <= n < 40:
        level = 6
    elif 20 <= n < 30:
        level = 5
    elif 10 <= n < 20:
        level = 4
    elif 5 <= n < 10:
        level = 3
    elif 1 <= n < 5:
        level = 2
    elif n > 0:
        level = 1
    elif n == 0:
        level = 0
    
    # return level
    if is_minus:
        return (-1) * level
    else:
        return level

    
def create_folder_if_not_exists(folder_path):
    """
    특정 폴더가 없으면 만들어주는 함수
    :param folder_path: 만들고자 하는 폴더의 경로
    """
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        print(f"폴더가 생성되었습니다: {folder_path}")
    else:
        print(f"폴더가 이미 존재합니다: {folder_path}")


def save_orderbook10(date, hour):
    df = pd.read_csv(f"./ob_data/{date}/{hour}.csv")
    df = df.astype(float)

    for i in range(1, 6):
        t_df = df.iloc[i * 10 - 10: i * 10]

        row_columns=t_df.columns
        columns = create_sorted_list(t_df[row_columns[2001]].min(), t_df[row_columns[1001]].max(), 0.1)
        result_df = pd.DataFrame(columns=columns)

        for row in t_df.itertuples():
            temp_dict = {column: 0 for column in columns}
        
            for j in range(1000):
                ask_price = round(row[j + 2], 1)
                ask_qty = float(row[j + 2002])
                temp_dict[ask_price] = -ask_qty
        
                bid_price = round(row[j + 1002], 1)
                bid_qty = float(row[j + 3002])
                temp_dict[bid_price] = bid_qty
            
            tt_df = pd.DataFrame(data=[list(temp_dict.values())], columns=list(temp_dict.keys()))
            result_df = pd.concat([result_df, tt_df])

        result_df.index = t_df['timestamp']
        result_df = result_df.transpose()
        result_df = result_df.astype(float)

        level_df = result_df.applymap(lambda x: set_level(x))
        level_df = level_df.replace(0, np.nan) 
        level_df.to_csv(f'ob_data/{date}/{hour}/{i * 10}.csv')


def create_ob_data(start_date, end_date):
    """
        start_date - ex) 2023-12-01 00
        end_Date - ex) 2024-04-01 00
    """

    for date, hour in get_dates_between(start_date, end_date):
        save_orderbook10(date, hour)



if __name__ == "__main__":
    create_ob_data("2023-12-01 00", "2024-04-01 00")


