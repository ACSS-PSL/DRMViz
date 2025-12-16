import argparse
from collections import defaultdict
from itertools import combinations
import os
import logging

import pandas as pd
import networkx as nx
import json

logger = logging.getLogger(__name__)


def load_data(inputs_path: str, dtype=str) -> list[pd.DataFrame]:
    thesesfr_df = pd.read_csv(os.path.join(inputs_path, "theses-soutenues-enhanced.csv"), dtype=dtype)
    drm_df = pd.read_csv(os.path.join(inputs_path, "drm_phd_list_serialized.csv"), dtype=dtype)
    if 'date_soutenance' in thesesfr_df.columns:
        thesesfr_df['date_soutenance'] = pd.to_datetime(thesesfr_df['date_soutenance'], errors='coerce')
    return thesesfr_df, drm_df


def extract_thesis_participants(df: pd.DataFrame) -> pd.DataFrame:
    def row_to_members(row):
        identifiers = set()
        phd_student = tuple()
        advisors = []
        jury_members = []

        idref = row.get('auteur.idref')
        prenom = row.get('auteur.prenom', '') or ''
        nom = row.get('auteur.nom', '') or ''
        fullname = f"{prenom if pd.notna(prenom) else ''} {nom if pd.notna(nom) else ''}".strip()
        identifier = idref if pd.notna(idref) and idref != '' else (fullname if fullname != '' else None)
        if identifier and (identifier not in identifiers):
            phd_student = (identifier, fullname)
            identifiers.add(identifier)

        for i in range(int(row.num_directeurs)):
            idref = row.get(f'directeur.{i}.idref')
            prenom = row.get(f'directeur.{i}.prenom', '') or ''
            nom = row.get(f'directeur.{i}.nom', '') or ''
            fullname = f"{prenom if pd.notna(prenom) else ''} {nom if pd.notna(nom) else ''}".strip()
            identifier = idref if pd.notna(idref) and idref != '' else (fullname if fullname != '' else None)
            if identifier and (identifier not in identifiers):
                advisors.append((identifier, fullname))
                identifiers.add(identifier)
        
        for i in range(int(row.num_membres_jury)):
            idref = row.get(f'membre_jury.{i}.idref')
            prenom = row.get(f'membre_jury.{i}.prenom', '') or ''
            nom = row.get(f'membre_jury.{i}.nom', '') or ''
            fullname = f"{prenom if pd.notna(prenom) else ''} {nom if pd.notna(nom) else ''}".strip()
            identifier = idref if pd.notna(idref) and idref != '' else (fullname if fullname != '' else None)
            if identifier and (identifier not in identifiers):
                jury_members.append((identifier, fullname))
                identifiers.add(identifier)

        for i in range(int(row.num_rapporteurs)):
            idref = row.get(f'rapporteur.{i}.idref')
            prenom = row.get(f'rapporteur.{i}.prenom', '') or ''
            nom = row.get(f'rapporteur.{i}.nom', '') or ''
            fullname = f"{prenom if pd.notna(prenom) else ''} {nom if pd.notna(nom) else ''}".strip()
            identifier = idref if pd.notna(idref) and idref != '' else (fullname if fullname != '' else None)
            if identifier and (identifier not in identifiers):
                jury_members.append((identifier, fullname))
                identifiers.add(identifier)
        
        if any([row.get("president_jury.idref"), row.get("president_jury.nom"), row.get("president_jury.prenom")]):
            idref = row.get('president_jury.idref')
            prenom = row.get('president_jury.prenom', '') or ''
            nom = row.get('president_jury.nom', '') or ''
            fullname = f"{prenom if pd.notna(prenom) else ''} {nom if pd.notna(nom) else ''}".strip()
            identifier = idref if pd.notna(idref) and idref != '' else (fullname if fullname != '' else None)
            if identifier and (identifier not in identifiers):
                jury_members.append((identifier, fullname))
                identifiers.add(identifier)

        return phd_student, advisors, jury_members

    df = df.copy()
    df[['phd_student', 'advisors', 'jury_members']] = df.apply(row_to_members, axis="columns", result_type="expand")
    return df


def filter_non_drm_theses(thesesfr_df: pd.DataFrame, drm_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    drm_df["author_identifier"]     = drm_df.apply(lambda row: row.author_idref     if row.author_idref     else f"{row.author_firstname} {row.author_surname}", axis="columns")
    drm_df["director_0_identifier"] = drm_df.apply(lambda row: row.director_0_idref if row.director_0_idref else f"{row.director_0_firstname} {row.director_0_surname}".strip(), axis="columns")
    drm_df["director_1_identifier"] = drm_df.apply(lambda row: row.director_1_idref if row.director_1_idref else f"{row.director_1_firstname} {row.director_1_surname}".strip(), axis="columns")
    drm_df["director_2_identifier"] = drm_df.apply(lambda row: row.director_2_idref if row.director_2_idref else f"{row.director_2_firstname} {row.director_2_surname}".strip(), axis="columns")

    identifiers = drm_df[["author_identifier", 
                          "director_0_identifier",
                          "director_1_identifier",
                          "director_2_identifier"]].stack().unique()

    thesesfr_df = thesesfr_df.loc[
        thesesfr_df.apply(lambda row: row.phd_student[0] if row.phd_student else "", axis="columns").isin(identifiers) |
        thesesfr_df.apply(lambda row: any(advisor[0] in identifiers for advisor in row.advisors), axis="columns")
    ]

    return thesesfr_df, drm_df


def correct_author_director_names(thesesfr_df: pd.DataFrame, drm_df: pd.DataFrame) -> pd.DataFrame:
    mapping: dict[str, str] = {}

    def fullname_from_parts(first, last):
        first = '' if pd.isna(first) else str(first).strip()
        last = '' if pd.isna(last) else str(last).strip()
        full = f"{first} {last}".strip()
        return full

    for drm_row in drm_df.itertuples(index=False):
        author_id = drm_row.author_identifier

        if author_id and not pd.isna(author_id) and author_id != '':
            full_name = fullname_from_parts(drm_row.author_firstname, drm_row.author_surname)
            if full_name:
                mapping[author_id] = full_name

        for i in range(3):
            id_col = f'director_{i}_identifier'
            first_col = f'director_{i}_firstname'
            last_col = f'director_{i}_surname'
            
            dir_id = getattr(drm_row, id_col)
            
            if dir_id and not pd.isna(dir_id) and dir_id != '':
                full_name = fullname_from_parts(getattr(drm_row, first_col, ''), getattr(drm_row, last_col, ''))
                if full_name:
                    mapping[dir_id] = full_name

    def _update_row(row: pd.Series) -> pd.Series:
        phd = row.phd_student
        if phd and len(phd) >= 1 and phd[0]:
            pid = phd[0]
            if pid in mapping:
                row['phd_student'] = (pid, mapping[pid])

        advisors = row.advisors
        if advisors and isinstance(advisors, (list, tuple)):
            new_advisors = []
            for advisor in advisors:
                if advisor[0] in mapping:
                    new_advisors.append((advisor[0], mapping[advisor[0]]))
                else:
                    new_advisors.append((advisor[0], advisor[1]))
            row['advisors'] = new_advisors

        return row

    thesesfr_df = thesesfr_df.apply(_update_row, axis='columns')
    return thesesfr_df


def filter_infrequent_members(df: pd.DataFrame, min_occurrences: int = 2) -> pd.DataFrame:
    """
    Removes jury members who did not do their PhD in DRM or did not direct a DRM thesis if
    they appear in less than `min_occurrences` juries.

    Parameters
    ----------
    df : pd.DataFrame
        The theses dataframe filtered to include only theses related to DRM by their PhD student or advisors.
    min_occurrences : int, default=2
        The minimum number or times a person should be in a jury to be kept in the dataset.

    Returns
    -------
    pd.DataFrame
        The theses dataframe filtered to keep only jury members occurring frequently-enough.
    """
    # TODO: ESSAYER DE COMPRENDRE POURQUOI LA VERSION PRÉCÉDENTE (min_occurrences=1 et filtrage appliqué à tous les types d'acteurs) 
    # donne + d'edges et - de noeuds que la version actuelle
    jury_members_ids = [member[0] for members in df["jury_members"] for member in members]
    phd_team_ids = [advisor[0] for advisors in df["advisors"] for advisor in advisors] + [phd_student[0] for phd_student in df["phd_student"]]
    
    counts = pd.Series(jury_members_ids).value_counts()
    df = df.copy()

    df['jury_members'] = df['jury_members'].apply(lambda members: [member for member in members if (counts.get(member[0], 0) >= min_occurrences) or member in phd_team_ids])

    df = df.loc[(df['advisors'].str.len() > 0) & df['phd_student']]

    return df


def build_edges(thesesfr_df: pd.DataFrame, drm_df: pd.DataFrame) -> tuple[dict[tuple[str, str], dict[int, int]], 
                                                                          dict[tuple[str, int], int], 
                                                                          dict[str, dict[str, str]]]:
    """Builds the edges dictionary as well as additional data to facilitate information retrieval.

    Parameters
    ----------
    thesesfr_df : pd.DataFrame
        The theses dataframe.
    drm_df : pd.Dataframe
        The dataframe of actual DRM theses.

    Returns
    -------
    edges: dict[tuple[str, str, str], dict[int, int]]
        A dictionary of the edges between persons in juries for each year. The data is shaped as follows:
        ```json
        {
            (identifier_1, identifier_2, "supervizes|examines|same_jury"): {
                year_1: n_occurrences_1,
                year_2: n_occurrences_2,
                ...
            },
            (identifier_2, identifier_3, "supervizes|examines|same_jury"): {
                year_1: n_occurrences_1,
                year_3: n_occurrences_3,
                ...
            },
            ...
        }
        ```

    participation_count: dict[tuple[str, int], int]
        A dictionary counting the number of occurrences in juries of each person. The data is shaped as follows:
        ```json
        {
            (identifier_1, year_1): n_occurrences_1,
            (identifier_1, year_2): n_occurrences_2,
            (identifier_2, year_2): n_occurrences_3,
            ...
        }
        ```

    members_info: dict[str, dict[str, str]]
        A dictionnary mapping a person's info to their identifier. The data is shaped as follows:
        ```json
        {
            "identifier_1": {
                "fullname": "fullname",
                "role": "phd_student|advisor|jury_member"  // Priority order is phd_student > advisor > jury_member
            },
            "identifier_2": {...}
            ...
        }
        ```
    """

    priority = [
        "phd_student",
        "advisor",
        "jury_member",
        "external_phd_student",
        "external_advisor"
    ]
    def _set_role_by_priority(existing_label: str, new_label: str) -> str:
        if priority.index(existing_label) <= priority.index(new_label):
            return existing_label
        return new_label

    edges: dict[tuple[str, str, str], dict[int, int]] = {}
    participation_count: dict[tuple[str, int], int] = defaultdict(int)
    members_info: dict[str, dict[str, str]] = {}

    for row in thesesfr_df.itertuples():
        year = None
        if pd.notna(row.date_soutenance):
            try:
                year = int(row.date_soutenance.year)
            except Exception:
                year = None
        if year is None:
            continue

        phd = row.phd_student
        if not phd or not phd[0]:
            continue
        phd_id, phd_name = phd[0], phd[1] if len(phd) > 1 else ''

        participation_count[(phd_id, year)] += 1

        if phd_id in drm_df.author_idref.values:
            phd_role = "phd_student"
            advisor_role = "advisor"
        else:
            phd_role = "external_phd_student"
            advisor_role = "external_advisor"

        if phd_id not in members_info:
            members_info[phd_id] = {'fullname': phd_name or '', 'role': phd_role}
        else:
            members_info[phd_id]['role'] = _set_role_by_priority(members_info[phd_id]['role'], phd_role)

        advisors = list(row.advisors) if row.advisors is not None else []
        jury_members = list(row.jury_members) if row.jury_members is not None else []

        # advisors -> phd : "supervizes"
        for adv_id, adv_name in advisors:
            if not adv_id:
                continue
            participation_count[(adv_id, year)] += 1
            if adv_id not in members_info:
                members_info[adv_id] = {'fullname': adv_name or '', 'role': advisor_role}
            else:
                members_info[adv_id]['role'] = _set_role_by_priority(members_info[adv_id]['role'], advisor_role)

            key = (adv_id, phd_id, 'supervizes')
            if key not in edges:
                edges[key] = defaultdict(int)
            edges[key][year] += 1

        # jury -> phd : "examines"
        for jur_id, jur_name in jury_members:
            if not jur_id:
                continue
            participation_count[(jur_id, year)] += 1
            if jur_id not in members_info:
                members_info[jur_id] = {'fullname': jur_name or '', 'role': 'jury_member'}

            key = (jur_id, phd_id, 'examines')
            if key not in edges:
                edges[key] = defaultdict(int)
            edges[key][year] += 1

        # jury <-> advisor : "same_jury" (directed from jury member/advisor to jury member/advisor)
        for (m1_id, _), (m2_id, _) in combinations(advisors + jury_members, 2):
            if not m1_id or not m2_id:
                continue
            key = tuple([m_id for m_id in sorted((m1_id, m2_id))] + ["same_jury"])
            if key not in edges:
                edges[key] = defaultdict(int)
            edges[key][year] += 1

    # convert nested defaultdicts to normal dicts for clarity
    edges = {k: dict(v) for k, v in edges.items()}
    participation_count = dict(participation_count)
    return edges, participation_count, members_info


def edges_to_df(edges: dict[tuple[str, str, str], dict[int, int]]) -> pd.DataFrame:
    """Convert labeled edges dict to a DataFrame with columns: source, target, year, label, weight

    edges: {(source, target, label): {year: count}}
    """
    rows = []
    for (src, tgt, label), years in edges.items():
        for year, count in years.items():
            rows.append((src, tgt, int(year), label, int(count)))

    df_edges = pd.DataFrame(rows, columns=['source', 'target', 'year', 'label', 'weight'])
    df_edges = df_edges.dropna(subset=['source', 'target', 'year']).copy()
    df_edges['year'] = df_edges['year'].astype(int)
    df_edges.sort_values('year', inplace=True)
    return df_edges.sort_values(['source', 'target', 'year', 'label']).reset_index(drop=True)


def remove_external_phd_students(df_edges: pd.DataFrame, members_info: dict[str, dict[str, str]]) -> tuple[pd.DataFrame, dict]:
    for member_info in list(members_info.keys()):
        if members_info[member_info]["role"] in ["external_phd_student", "external_advisor"]:
            members_info.pop(member_info)
    
    df_edges = df_edges.loc[df_edges[["source", "target"]].isin(members_info.keys()).all(axis="columns")]

    return df_edges, members_info


def create_spring_layout(df_edges: pd.DataFrame, members_info: dict[str, dict[str, str]]) -> dict:
    graph = nx.Graph()
    graph.add_weighted_edges_from(df_edges[["source", "target", "weight"]].to_numpy())
    single_nodes = [m for m in members_info if not graph.has_node(m)]
    graph.add_nodes_from(single_nodes)
    spring = nx.spring_layout(graph, k=10/(len(graph) ** 1/2), seed=1234)

    return spring


def add_betweenness_centrality(df_edges: pd.DataFrame, members_info: dict[str, dict[str, str]]) -> dict:
    graph = nx.Graph()
    graph.add_weighted_edges_from(df_edges[["source", "target", "weight"]].to_numpy())
    single_nodes = [m for m in members_info if not graph.has_node(m)]
    graph.add_nodes_from(single_nodes)
    centrality_scores = nx.betweenness_centrality(graph, normalized=False)
    for node in graph.nodes:
        members_info[node]["weight"] = centrality_scores[node]

    return members_info


def apply_clustering(df_edges: pd.DataFrame, members_info: dict[str, dict[str, str]]) -> dict:
    graph = nx.Graph()
    graph.add_weighted_edges_from(df_edges[["source", "target", "weight"]].to_numpy())
    single_nodes = [m for m in members_info if not graph.has_node(m)]
    graph.add_nodes_from(single_nodes)
    louvain_clustering = nx.community.louvain_communities(graph, seed=12345)

    for node in graph.nodes:
        for i, cluster in enumerate(louvain_clustering):
            if node in cluster:
                members_info[node]["cluster"] = i
                break
    return members_info


def save_graph(members_info: dict[str, dict[str, str]], df_edges: pd.DataFrame, spring_layout: dict, out_path: str) -> None:
    nodes = []
    for member_id, info in members_info.items():
        nodes.append({
            "key": member_id, 
            "label": info["fullname"],
            "weight": info["weight"],
            "role": info["role"],
            "x": spring_layout[member_id][0],
            "y": spring_layout[member_id][1]
        })
    
    edges = []
    for edge in df_edges.itertuples():
        edges.append({
            "source": edge.source,
            "target": edge.target,
            "label": edge.label,
            "weight": edge.weight,
            "year": edge.year
        })
    
    dataset = {
        "nodes": nodes,
        "edges": edges
    }

    with open(os.path.join(out_path, "dataset.json"), "w", encoding="utf8") as file:
        json.dump(dataset, file, separators=(',', ':'), indent=None)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Generate co-occurrence edges from theses jury data")
    parser.add_argument('--input_path', '-i', default='./data')
    parser.add_argument('--output_path', '-o', default='./data', help='Output directory for edges and nodes CSV files')
    parser.add_argument('--min-occurrences', '-m', type=int, default=2)
    parsed = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s', datefmt="%H:%M:%S")

    logger.info("Loading the data")
    thesesfr_df, drm_df = load_data(parsed.input_path)
    logger.info("Extracting participants in PhD juries")
    thesesfr_df = extract_thesis_participants(thesesfr_df)
    logger.info("Filtering out non-DRM theses")
    thesesfr_df, drm_df = filter_non_drm_theses(thesesfr_df, drm_df)
    logger.info("Applying correction to known names")
    thesesfr_df = correct_author_director_names(thesesfr_df, drm_df)
    logger.info(f"Filtering out jury members present in less than {parsed.min_occurrences} juries")
    thesesfr_df = filter_infrequent_members(thesesfr_df, min_occurrences=parsed.min_occurrences)
    logger.info("Building the graph")
    edges, participation_count, members_info = build_edges(thesesfr_df, drm_df)
    df_edges = edges_to_df(edges)
    logger.info("Remove external PhD students")
    df_edges, members_info = remove_external_phd_students(df_edges, members_info)
    logger.info("Adding graph features")
    spring_layout = create_spring_layout(df_edges, members_info)
    members_info = add_betweenness_centrality(df_edges, members_info)
    members_info = apply_clustering(df_edges, members_info)

    save_graph(members_info, df_edges, spring_layout, parsed.output_path)
    logger.info(f"Saved {len(members_info)} nodes and {len(df_edges)} edges.")
