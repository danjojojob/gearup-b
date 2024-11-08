import React, { useState, useEffect, useCallback } from 'react';
import { Accordion } from 'react-bootstrap';
import { getWheelsetItems } from '../../../services/bikeBuilderService';
import arrowUp from '../../../assets/icons/arrow-up.png';
import arrowDown from '../../../assets/icons/arrow-down.png';

const Wheelset = ({ onAddToBuild, selectedFrame, selectedFork, selectedGroupset }) => {
    const [items, setItems] = useState([]);
    const [sortOrder, setSortOrder] = useState("asc");
    const [loading, setLoading] = useState(true);


    const fetchItems = useCallback(async () => {
        try {
            const data = await getWheelsetItems();

            // Apply filtering logic based on selected frame, fork, and groupset attributes
            const filteredWheelsets = data.filter(item => {
                const isCassetteTypeMatch = item.hub_cassette_type === selectedGroupset.cassette_type;
                const isHubSpeedMatch = item.rear_hub_speed === selectedGroupset.cassette_speed;
                const isRotorMountTypeMatch = item.hub_rotor_type === selectedGroupset.rotor_mount_type;

                const isRearHubWidthMatch = item.rear_hub_width === selectedFrame.rear_hub_width;
                const isFrontHubWidthMatch = item.front_hub_width === selectedFork.front_hub_width;

                const isRearHubAxleTypeMatch = item.rear_hub_axle_type === selectedFrame.axle_type;
                const isFrontHubAxleTypeMatch = item.front_hub_axle_type === selectedFork.axle_type;

                const isTireSizeMatch = item.tire_size === selectedFrame.frame_size;
                const isTireWidthMatch = item.tire_width <= selectedFrame.max_tire_width;

                // Return only if all conditions are met
                return isCassetteTypeMatch &&
                    isHubSpeedMatch &&
                    isRotorMountTypeMatch &&
                    isRearHubWidthMatch &&
                    isFrontHubWidthMatch &&
                    isRearHubAxleTypeMatch &&
                    isFrontHubAxleTypeMatch &&
                    isTireSizeMatch &&
                    isTireWidthMatch;
            });

            // Sort the filtered results based on the sort order
            const sortedWheelsets = filteredWheelsets.sort((a, b) => {
                return sortOrder === "asc" ? a.item_price - b.item_price : b.item_price - a.item_price;
            });

            setItems(sortedWheelsets);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching wheelset items:", error);
        }
    }, [sortOrder, selectedFrame, selectedFork, selectedGroupset]);

    useEffect(() => {
        if (selectedFrame && selectedFork && selectedGroupset) {
            fetchItems();
        }
    }, [fetchItems, selectedFrame, selectedFork, selectedGroupset]);

    const PesoFormat = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
    });

    return (
        <div className="parts-container">
            <div className="sort-container">
                <div className='sort-title'>
                    Sort Price :
                </div>
                <button
                    className="btn"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                    {sortOrder === "asc" ? (
                        <img src={arrowDown} alt="Sort Descending" />
                    ) : (
                        <img src={arrowUp} alt="Sort Ascending" />
                    )}
                </button>
            </div>

            {loading && 
                <div className='loading'>
                    <i className='fa-solid fa-gear fa-spin'></i>
                </div>
            }

            {!loading &&<div className="parts-cards">
                {items.map((item) => (
                    <div className="parts-card" key={item.wheelset_id}>
                        <div className="item-image"  onClick={() => onAddToBuild(item)}>
                            {item.item_image ? (
                                <img src={`data:image/png;base64,${item.item_image}`} alt="Wheelset" />
                            ) : (
                                <p>No Image Available</p>
                            )}
                        </div>
                        <div className="item-name">{item.item_name}</div>
                        <div className="item-price">
                            {PesoFormat.format(item.item_price)}
                            <br />
                            {item.tire_size} - {item.tire_width}
                        </div>

                        <Accordion>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>Details</Accordion.Header>
                                <Accordion.Body>{item.description}</Accordion.Body>
                            </Accordion.Item>
                            <Accordion.Item eventKey="1">
                                <Accordion.Header>Tech Specs</Accordion.Header>
                                <Accordion.Body>
                                    <div className='specs-container'>Hub - Rotor Type: {item.hub_rotor_type}</div>
                                    <div className='specs-container'>Hub - Cassette Type: {item.hub_cassette_type}</div>
                                    <div className='specs-container'>Hub Holes: {item.hub_holes}</div>
                                    <div className='specs-container'>Front Hub Width: {item.front_hub_width}</div>
                                    <div className='specs-container'>Front Hub - Axle Type: {item.front_hub_axle_type}</div>
                                    <div className='specs-container'>Front Hub - Axle Diameter: {item.front_hub_axle_diameter}</div>
                                    <div className='specs-container'>Rear Hub Width: {item.rear_hub_width}</div>
                                    <div className='specs-container'>Rear Hub - Axle Type: {item.rear_hub_axle_type}</div>
                                    <div className='specs-container'>Rear Hub - Axle Diameter: {item.rear_hub_axle_diameter}</div>
                                    <div className='specs-container'>Rear Hub Speed: {item.rear_hub_speed}</div>
                                    <div className='specs-container'>Tire Size: {item.tire_size}</div>
                                    <div className='specs-container'>Tire Width: {item.tire_width}</div>
                                    <div className='specs-container'>Rim Spokes: {item.rim_spokes}</div>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </div>
                ))}
            </div>}
        </div>
    );
};

export default Wheelset;
