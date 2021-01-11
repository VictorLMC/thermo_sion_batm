# -*- coding: utf-8 -*-
"""
Created on Fri Jan  8 14:17:04 2021

@author: manip.batm
"""



import numpy as np
import matplotlib.pyplot as plt
import csv

#%% READING OF THE TABLE DATA

# C47 table from Clément
c47 = csv.reader(open("c47.csv"), delimiter=";")
c47_temp = np.array([])
c47_res = np.array([])

for row in c47:
    c47_temp = np.append(c47_temp, float(row[0]))
    c47_res = np.append(c47_res, float(row[1]))

# C100 TABLE FROM THE LAB ("Etalonnage-C100-Benoit")
c100 = csv.reader(open("c100_labo.csv"), delimiter=";")
c100_temp = np.array([])
c100_res = np.array([])

for row in c100:
    c100_temp = np.append(c100_temp, float(row[0]))
    c100_res = np.append(c100_res, float(row[1]))


# C100-NPt-RuO2 table from Arpit
mix_arpit = csv.reader(open("mix_arpit.csv"), delimiter=";")
mix_arpit_temp = np.array([])
mix_arpit_res = np.array([])

for row in mix_arpit:
    mix_arpit_temp = np.append(mix_arpit_temp, float(row[0]))
    mix_arpit_res = np.append(mix_arpit_res, float(row[1]))


#%% SEPARATE PROCESSING OF THE COLDEST TEMPERATURES (not in the C100 table)
"""
Under the minimum temperature of the C100 table, we consider C100 negligible.
In the end of the script, we add these values to the interpolated ones.
Also, we discard the values from Arpit that are hotter than the max in C100 table
(can't be interpolated) and we add the 300K value by hand in the end.
"""
arpit_only_temp = np.array([])
arpit_only_res = np.array([])
arpit_interp_temp = np.array([])
arpit_interp_res = np.array([])

c100_min_temp = c100_temp[0]
c100_max_temp = c100_temp[-1]
for i in range(len(mix_arpit_temp)):
    t = mix_arpit_temp[i]
    r = mix_arpit_res[i]
    if t < c100_min_temp:
        # Append mixed temp and res values to the Arpit only arrays
        arpit_only_temp = np.append(arpit_only_temp, t)
        arpit_only_res = np.append(arpit_only_res, r)
    elif t < c100_max_temp:
        arpit_interp_temp = np.append(arpit_interp_temp, t)
        arpit_interp_res = np.append(arpit_interp_res, r)

#%% LINEAR INTERPOLATION OF C100 TABLE AT ARPIT'S TEMPERATURES

n = len(arpit_interp_temp)
nc = len(c100_temp)
c100_interp_res = np.zeros(n)

for i in range(n):
    k=0 # Counter that will give the position of the interpolation interval
    arpit_temp_curr = arpit_interp_temp[i]
    arpit_res_curr = arpit_interp_res[i]
    # Search of interval of C47 temp containing the current Ruo2 temp
    while (c100_temp[k] < arpit_temp_curr) and (k < nc-1):
        k+=1
    # Computation of the interpolated C47 resistance value
    x = (arpit_temp_curr - c100_temp[k-1])/(c100_temp[k] - c100_temp[k-1])
    r = x*c100_res[k-1] + (1-x)*c100_res[k]
    # Append the new values to the arrays of interpolated values
    c100_interp_res[i] = r

#%% SUBTRACTION OF C100 FROM ARPIT'S TABLE

mix_arpit_res_without_c100_interp = 1/(1/arpit_interp_res - 1/c100_interp_res)

#%% MERGING OF ARPIT ONLY AND C100 INTERPOLATED VALUES

mix_arpit_temp_without_c100 = np.append(arpit_only_temp, arpit_interp_temp)
mix_arpit_res_without_c100 = np.append(arpit_only_res, mix_arpit_res_without_c100_interp)


#%% SEPARATE PROCESSING OF THE COLDEST TEMPERATURES (not in the C47 table)
"""
Under the minimum temperature of the C47 table, we consider C47 negligible.
In the end of the script, we add these values to the interpolated ones.
Also, we discard the values from Arpit that are hotter than the max in C100 table
(can't be interpolated) and we add the 300K value by hand in the end.
"""
arpit_only_temp = np.array([])
arpit_only_res = np.array([])
arpit_interp_temp = np.array([])
arpit_interp_res = np.array([])

c47_min_temp = c47_temp[0]
c47_max_temp = c47_temp[-1]
for i in range(len(mix_arpit_temp_without_c100)):
    t = mix_arpit_temp_without_c100[i]
    r = mix_arpit_res_without_c100[i]
    if t < c47_min_temp:
        # Append mixed temp and res values to the Arpit only arrays
        arpit_only_temp = np.append(arpit_only_temp, t)
        arpit_only_res = np.append(arpit_only_res, r)
    elif t < c47_max_temp:
        arpit_interp_temp = np.append(arpit_interp_temp, t)
        arpit_interp_res = np.append(arpit_interp_res, r)

#%% LINEAR INTERPOLATION OF C47 TABLE AT ARPIT'S TEMPERATURES

n = len(arpit_interp_temp)
nc = len(c47_temp)
c47_interp_res = np.zeros(n)

for i in range(n):
    k=0 # Counter that will give the position of the interpolation interval
    arpit_temp_curr = arpit_interp_temp[i]
    arpit_res_curr = arpit_interp_res[i]
    # Search of interval of C47 temp containing the current Ruo2 temp
    while (c47_temp[k] < arpit_temp_curr) and (k < nc-1):
        k+=1
    # Computation of the interpolated C47 resistance value
    x = (arpit_temp_curr - c47_temp[k-1])/(c47_temp[k] - c47_temp[k-1])
    r = x*c47_res[k-1] + (1-x)*c47_res[k]
    # Append the new values to the arrays of interpolated values
    c47_interp_res[i] = r

#%% ADDITION OF C47 TO ARPIT'S TABLE WITHOUT C100

mix_res_final_interp = 1/(1/arpit_interp_res + 1/c47_interp_res)

#%% MERGING OF ARPIT WITHOUT C100 AND C47 INTERPOLATED VALUES

mix_temp_final = np.append(arpit_only_temp, arpit_interp_temp)
mix_res_final = np.append(arpit_only_res, mix_res_final_interp)

#%% DATA WRITING INTO CSV FILE

with open('mix_csv.csv', 'w', newline='') as csvfile:
    mix = csv.writer(csvfile, delimiter=';')
    for i in range(len(mix_temp_final)):
        mix.writerow([str(mix_temp_final[i]), str(mix_res_final[i])])