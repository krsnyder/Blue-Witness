import React, { useEffect, useState } from 'react';
import './Incidents.css';
import sourceListHelper from '../../utils/sourceListHelper';
import {
  falsiesRemoved,
  filterDataByState,
  filterDataByDate,
  createRange,
  filterByTags,
} from '../incidents/IncidentFilter';
import { nanoid } from 'nanoid';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Empty, Button, Collapse, Tag, Checkbox, Popover, Select } from 'antd';

// Time Imports
import { DateTime } from 'luxon';

// Search Bar
import SearchBar from '../graphs/searchbar/SearchBar';

// Ant Design Imports:
import { AutoComplete, Pagination, DatePicker } from 'antd';

let ranks = [
  'Rank 1 - Police Presence',
  'Rank 2 - Empty-hand',
  'Rank 3 - Blunt Force',
  'Rank 4 - Chemical & Electric',
  'Rank 5 - Lethal Force',
];

const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Option } = Select;
const { CheckableTag } = Tag;

const Incidents = () => {
  const [itemsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);

  // Data State
  const [usState, setUsState] = useState(null);
  const [dates, setDates] = useState(null);
  const [data, setData] = useState([]); // State for User Searches
  const [selectedTags, setSelectedTags] = useState(['All']);
  const [queryString, setQueryString] = useState('');
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [rank, setRank] = useState('All');
  // Get incident data from Redux
  const incidents = useSelector(state => Object.values(state.incident.data));
  const tagIndex = useSelector(state => Object.keys(state.incident.tagIndex));
  const fetchStatus = useSelector(
    state => state.api.incidents.getincidents.status
  );

  const [value, setValue] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);

  const categoriesData = [];

  const allObj = {
    value: 'All',
  };

  categoriesData.push(allObj);

  for (let tag of tagIndex) {
    if (tag.length < 3) {
      continue;
    } else {
      const item = {
        value: tag,
      };
      categoriesData.push(item);
    }
  }

  const header = incident => {
    return (
      <div className="header-top">
        <p id="title">{incident.title}</p>
        <div className="extra">
          <div className="tag-group">
            <Tag>{incident.categories[0]}</Tag>
            <Tag>{incident.categories[1]}</Tag>
            <Tag>{incident.categories[2]}</Tag>
          </div>
          <div>
            <Tag>{incident.force_rank.slice(0, 6)}</Tag>
          </div>

          <div className="incidentDate">
            <p>{incident.city}, </p>
            <p className="panel-date">
              {DateTime.fromISO(incident.date)
                .plus({ days: 1 })
                .toLocaleString(DateTime.DATE_MED)}
            </p>
          </div>

          <Checkbox
            checked={selectedIncidents.indexOf(incident.id) > -1}
            onChange={checked => onSelect(incident.id, checked)}
          >
            Add To List
          </Checkbox>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const range = dates && createRange(dates);
    let filtered = [...incidents];
    if (
      activeCategories.length !== 0 &&
      activeCategories.indexOf('All') === -1
    ) {
      filtered = filterByTags(filtered, activeCategories);
    }
    if (usState) {
      filtered = filterDataByState(filtered, usState);
    }
    if (dates) {
      const startDate = `${dates[0].c.year}-${dates[0].c.month}-${dates[0].c.day}`;
      const endDate = `${dates[1].c.year}-${dates[1].c.month}-${dates[1].c.day}`;
      setQueryString(`&state=${usState}&start=${startDate}&end=${endDate}`);
      filtered = filterDataByDate(filtered, range);
    }
    if (rank !== 'All') {
      filtered = filtered.filter(incident => {
        return incident.force_rank.trim() === ranks[parseInt(rank) - 1].trim();
      });
    }
    setData(falsiesRemoved(filtered));
  }, [usState, dates, activeCategories, rank]);

  const indexOfLastPost = currentPage * itemsPerPage;
  const indexOfFirstPost = indexOfLastPost - itemsPerPage;
  const currentPosts = data.slice(indexOfFirstPost, indexOfLastPost);

  const onSelect = id => {
    let newSelectedIncidents = [];
    if (selectedIncidents.indexOf(id) > -1) {
      newSelectedIncidents = selectedIncidents.filter(i => i !== id);
    } else {
      newSelectedIncidents = [...selectedIncidents, id];
    }
    setSelectedIncidents(newSelectedIncidents);
  };

  const onChange = page => {
    setCurrentPage(page);
  };

  const onToggle = (tag, checked) => {
    let nextSelectedTags = checked
      ? [...activeCategories, tag]
      : activeCategories.filter(t => t !== tag || t === 'All');
    if (tag === 'All') {
      setActiveCategories([]);
      return;
    }
    if (nextSelectedTags[0] === 'All') {
      setActiveCategories(nextSelectedTags.slice(1));
      return;
    }
    setActiveCategories(nextSelectedTags);
  };

  const onRank = e => {
    setRank(e);
  };
  const downloadCSV = () => {
    console.log(
      `${
        process.env.REACT_APP_BACKENDURL
      }/incidents/download?rank=${rank}${queryString}${`&ids=${selectedIncidents.join(
        ','
      )}`}`
    );
    axios
      .get(
        `${
          process.env.REACT_APP_BACKENDURL
        }/incidents/download?rank=${rank}${queryString}${`&ids=${selectedIncidents.join(
          ','
        )}`}`
      )
      .then(response => {
        console.log(response);
        let link = document.createElement('a');
        link.href = window.URL.createObjectURL(
          new Blob([response.data], { type: 'application/octet-stream' })
        );
        link.download = 'reports.csv';

        document.body.appendChild(link);

        link.click();
        setTimeout(function() {
          window.URL.revokeObjectURL(link);
        }, 200);
      })
      .catch(error => {});
  };

  const onDateSelection = (dates, dateStrings) => {
    setDates(
      dateStrings[0] && dateStrings[1]
        ? [DateTime.fromISO(dateStrings[0]), DateTime.fromISO(dateStrings[1])]
        : null
    );
  };

  const noDataDisplay = () => {
    return (
      <div className="no-data-container">
        <Empty
          className="no-data"
          imageStyle={{
            height: 200,
          }}
          description={
            <span>
              There are no incident reports matching these search criteria.
              <span style={{ color: '#003767' }}>{usState}</span>
            </span>
          }
        />
      </div>
    );
  };

  const onCategoryChange = data => {
    setValue(data);
  };
  const onCategorySelect = data => {
    if (activeCategories.includes(data)) {
      setValue('');
      return;
    } else {
      setActiveCategories([...activeCategories, data]);
      setValue('');
    }
  };
  const filterOption = (inputValue, option) => {
    return inputValue.slice(0, inputValue.length).toLowerCase() ===
      option.value.slice(0, inputValue.length).toLowerCase()
      ? option
      : null;
  };

  return (
    <div className="incidents-container">
      <div className="incidents-page">
        <header>
          <form className="export-form">
            <fieldset className="form-top">
              <label>
                Rank:
                <Select
                  onChange={onRank}
                  showSearch
                  defaultValue="All"
                  className="rank-select"
                  style={{ width: 120 }}
                >
                  <Option value="All">All</Option>
                  <Option value="1">Rank: 1</Option>
                  <Option value="2">Rank: 2</Option>
                  <Option value="3">Rank: 3</Option>
                  <Option value="4">Rank: 4</Option>
                  <Option value="5">Rank: 5</Option>
                </Select>
              </label>

              <label>
                Location: <SearchBar setUsState={setUsState} />{' '}
              </label>

              <label>
                Date: <RangePicker onCalendarChange={onDateSelection} />
              </label>

              <Button
                onClick={downloadCSV}
                type="primary"
                style={{ background: '#003767' }}
              >
                Export List
              </Button>
            </fieldset>
            <fieldset className="form-bottom">
              <label>
                Categories:
                <AutoComplete
                  value={value}
                  options={categoriesData}
                  onSelect={onCategorySelect}
                  onChange={onCategoryChange}
                  style={{ width: 200 }}
                  allowClear={true}
                  filterOption={filterOption}
                  placeholder="Browse Categories"
                  notFoundContent="Category Not Found"
                />
                {activeCategories &&
                  activeCategories.map(tag => {
                    return (
                      <CheckableTag
                        key={tag}
                        checked={activeCategories.indexOf(tag) > -1}
                        onChange={checked => onToggle(tag, checked)}
                      >
                        {tag}
                      </CheckableTag>
                    );
                  })}
              </label>
            </fieldset>
          </form>
        </header>
        <section>
          {data.length ? (
            <Collapse key={nanoid()} className="collapse">
              {currentPosts.map(incident => {
                return (
                  <Panel
                    header={header(incident)}
                    className="panel"
                    expandIconPosition="left"
                    key={incident.id}
                  >
                    <div className="collapse-content">
                      <p>{incident.desc}</p>

                      <Popover
                        content={sourceListHelper(incident)}
                        placement="rightTop"
                      >
                        <Button
                          type="primary"
                          style={{
                            backgroundColor: '#003767',
                            border: 'none',
                          }}
                        >
                          Sources
                        </Button>
                      </Popover>
                    </div>
                    {incident.categories.map(i => {
                      return <Tag>{i}</Tag>;
                    })}
                  </Panel>
                );
              })}
            </Collapse>
          ) : (
            noDataDisplay()
          )}
        </section>
      </div>
      <section className="pagination">
        <Pagination
          onChange={onChange}
          current={currentPage}
          pageSize={itemsPerPage}
          total={data.length}
          showSizeChanger={false}
        />
      </section>
    </div>
  );
};

export default Incidents;
