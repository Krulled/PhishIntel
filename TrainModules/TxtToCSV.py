import pandas as pd

def combine_csvs(file1, file2, output_file):
    # Read the two CSV files into DataFrames
    df1 = pd.read_csv('verified_online.csv')
    df2 = pd.read_csv('output.csv')
    
    # Get the union of columns in both DataFrames
    all_columns = list(set(df1.columns) | set(df2.columns))
    
    # Reindex both DataFrames with the union of all columns so they line up correctly
    df1 = df1.reindex(columns=all_columns)
    df2 = df2.reindex(columns=all_columns)
    
    # Concatenate the DataFrames vertically
    combined_df = pd.concat([df1, df2], ignore_index=True)
    
    # Write the combined DataFrame to a CSV file (without the index)
    combined_df.to_csv(output_file, index=False)
    
    print(f"Combined CSV saved to '{output_file}' with {len(combined_df)} rows.")

if __name__ == "__main__":
    # Adjust file names/paths as required
    combine_csvs("output.csv", "verified_online.csv", "combined.csv")
