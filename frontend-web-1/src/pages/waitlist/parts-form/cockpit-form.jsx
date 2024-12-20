import React, { useState, useEffect } from 'react';
import exit from "../../../assets/icons/exit.png";
import del from "../../../assets/icons/delete.png";
import ImageUploadButton from '../../../components/img-upload-button/img-upload-button';
import { addCockpit } from '../../../services/waitlistService';
import {Modal, Button} from 'react-bootstrap';

const CockpitForm = ({ waitlistItemID, itemID, itemName, itemPrice, onClose, refreshWaitlist, deleteItem, role, setShowDeleteModal, setShowResponseModal, retrievedBikeTypes}) => {
    // States management
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [handlebarLength, setHandlebarLength] = useState('');
    const [handlebarClampDiameter, setHandlebarClampDiameter] = useState('');
    const [handlebarType, setHandlebarType] = useState('');
    const [stemClampDiameter, setStemClampDiameter] = useState('');
    const [stemLength, setStemLength] = useState('');
    const [stemAngle, setStemAngle] = useState('');
    const [stemForkDiameter, setStemForkDiameter] = useState('');
    const [headsetType, setHeadsetType] = useState('');
    const [headsetCupType, setHeadsetCupType] = useState('');
    const [headsetUpperDiameter, setHeadsetUpperDiameter] = useState('');
    const [headsetLowerDiameter, setHeadsetLowerDiameter] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [handlebarError, setHandlebarError] = useState('');
    const [headsetTypeError, setHeadsetTypeError] = useState('');

    const [handlebarIsCorrect, setHandlebarIsCorrect] = useState(false);
    const [headsetIsCorrect, setHeadsetIsCorrect] = useState(false);


    function ConfirmationModal({ onHide, onConfirm, ...props }) {
		return (
			<Modal
				{...props}
				size="md"
				aria-labelledby="contained-modal-title-vcenter"
				centered
			>
				<Modal.Header closeButton onClick={onHide}>
					<Modal.Title id="contained-modal-title-vcenter">
						Confirmation
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>
						Do you confirm these specifications?
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => {
							onHide();
					}}>
						Cancel
					</Button>
					<Button variant="primary" onClick={() => {
							onConfirm();
						}}>
						Save
					</Button>
				</Modal.Footer>
			</Modal>
		);
	}

    // Populate item name and price
    useEffect(() => {
        setName(itemName);
        setPrice(itemPrice);
    }, [itemName, itemPrice]);

    const [bikeType, setBikeType] = useState('');

    // Submit part
    const handleSubmit = async () => {

        if(!handlebarIsCorrect || !headsetIsCorrect) return;

        const formData = new FormData();
        formData.append('waitlist_item_id', waitlistItemID);
        formData.append('item_id', itemID);
        formData.append('description', description);
        formData.append('handlebar_length', handlebarLength);
        formData.append('handlebar_clamp_diameter', handlebarClampDiameter);
        formData.append('handlebar_type', handlebarType);
        formData.append('stem_clamp_diameter', stemClampDiameter);
        formData.append('stem_length', stemLength);
        formData.append('stem_angle', stemAngle);
        formData.append('stem_fork_diameter', stemForkDiameter);
        formData.append('headset_type', headsetType);
        formData.append('headset_cup_type', headsetCupType);
        formData.append('headset_upper_diameter', headsetUpperDiameter);
        formData.append('headset_lower_diameter', headsetLowerDiameter);
        if (selectedFile) {
            formData.append('image', selectedFile);
        }
        formData.append('type', bikeType);

        try {
            await addCockpit(formData);
            setShowConfirmModal(false);
            setShowResponseModal(true);

            // Reset Form
            setDescription('');
            setHandlebarLength('');
            setHandlebarClampDiameter('');
            setHandlebarType('');
            setStemClampDiameter('');
            setStemLength('');
            setStemAngle('');
            setStemForkDiameter('');
            setHeadsetType('');
            setHeadsetCupType('');
            setHeadsetUpperDiameter('');
            setHeadsetLowerDiameter('');
            setSelectedFile(null);
            onClose();
            refreshWaitlist();

        } catch (error) {
            console.error('Failed to add item:', error);
        }
    };

    // Select image file
    const handleFileSelect = (file) => {
        setSelectedFile(file);
    };

    function handleBarCorrect(){
        // handlebar clamp diameter must be same as stem clamp diameter
        if(handlebarClampDiameter === stemClampDiameter){
            setHandlebarError('');
            return setHandlebarIsCorrect(true);
        } else {
            setHandlebarError('Handlebar clamp diameter must be the same as stem clamp diameter');
            return setHandlebarIsCorrect(false);
        }
    }

    function headsetTypeCorrect(){
        // if headset type is tapered, headset upper diameter must be smaller than headset lower diameter
        // if headset type is non tapered, headset upper diameter must be equal to headset lower diameter
        if(headsetType === 'Tapered' && headsetUpperDiameter < headsetLowerDiameter){
            setHeadsetTypeError('');
            return setHeadsetIsCorrect(true);
        }

        if(headsetType === 'Non Tapered' && headsetUpperDiameter === headsetLowerDiameter){
            setHeadsetTypeError('');
            return setHeadsetIsCorrect(true);
        }

        if(headsetType === 'Tapered' && headsetUpperDiameter >= headsetLowerDiameter){
            setHeadsetTypeError('Headset upper diameter must be smaller than headset lower diameter');
            return setHeadsetIsCorrect(false);
        }

        if(headsetType === 'Non Tapered' && headsetUpperDiameter !== headsetLowerDiameter){
            setHeadsetTypeError('Headset upper diameter must be equal to headset lower diameter');
            return setHeadsetIsCorrect(false);
        }
    }

    useEffect(() => {
        handleBarCorrect();
        headsetTypeCorrect();
    }, [handlebarClampDiameter, stemClampDiameter, headsetType, headsetUpperDiameter, headsetLowerDiameter ]);

    return (
        <>  
            <ConfirmationModal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onConfirm={() => {
                    handleSubmit();
                }}
            />
            <form className="form-content" onSubmit={(e) => {
                    e.preventDefault(); // Prevent default form submission
                    setShowConfirmModal(true); // Show confirmation modal
                }}>
                <div className="container-1 d-flex">
                    <h4>Set Specifications</h4>
                    <div className="btns">
                        <div className="exit-btn">
                            <img
                                src={exit}
                                alt="Exit"
                                className="exit-icon"
                                onClick={onClose}
                            />
                        </div>
                        {role == 'admin' && <div className="del-btn">
                            <img src={del}
                                alt="Delete"
                                className="del-icon"
                                onClick={() => setShowDeleteModal(true)} />
                        </div>}
                    </div>
                </div>

                <ImageUploadButton onFileSelect={handleFileSelect} part={'cockpit'}/>

                <div className="input-container form-group">
                    <label htmlFor="item-name-cockpit">Name</label>
                    <input
                        type="text"
                        id="item-name-cockpit"
                        name="itemName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled
                    />
                </div>

                <div className="input-container form-group">
                    <label htmlFor="item-price-cockpit">Price</label>
                    <input
                        type="text"
                        id="item-price-cockpit"
                        name="itemPrice"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled
                    />
                </div>

                <div className="input-container form-group">
                    <label htmlFor="item-description-cockpit">Description</label>
                    <textarea
                        type="text"
                        id="item-description-cockpit"
                        name="itemDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter item description"
                        required
                    ></textarea>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Bike Type</div>
                    <select
                        className="dropdown"
                        id="type"
                        name="type"
                        defaultValue=""
                        required
                        onChange={(e) => {
                            setBikeType(e.target.value);
                        }}
                    >   
                        <option value="">Select Bike Type</option>
                        {retrievedBikeTypes.map((bikeType, index) => (
                            <option key={index} value={bikeType.bike_type_id}>
                                {bikeType.bike_type_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Handlebar Length</div>
                    <select
                        className="dropdown"
                        id="handlebar-length"
                        name="handlebarLength"
                        value={handlebarLength}
                        onChange={(e) => setHandlebarLength(e.target.value)}
                        required
                    >
                        <option value="">Select Length</option>
                        <option value="680mm">680mm</option>
                        <option value="700mm">700mm</option>
                        <option value="720mm">720mm</option>
                        <option value="760mm">760mm</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Handlebar Clamp Diameter</div>
                    <select
                        className="dropdown"
                        id="handlebar-clamp-diameter"
                        name="handlebarClampDiameter"
                        value={handlebarClampDiameter}
                        onChange={(e) => setHandlebarClampDiameter(e.target.value)}
                        required
                    >
                        <option value="">Select Diameter</option>
                        <option value="25.4mm">25.4mm</option>
                        <option value="31.8mm">31.8mm</option>
                        <option value="35mm">35mm</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Handlebar Type</div>
                    <select
                        className="dropdown"
                        id="handlebar-type"
                        name="handlebarType"
                        value={handlebarType}
                        onChange={(e) => setHandlebarType(e.target.value)}
                        required
                    >
                        <option value="">Select Type</option>
                        <option value="Flat">Flat</option>
                        <option value="Riser">Riser</option>
                        <option value="Drop">Drop</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Stem Clamp Diameter</div>
                    <select
                        className="dropdown"
                        id="stem-clamp-diameter"
                        name="stemClampDiameter"
                        value={stemClampDiameter}
                        onChange={(e) => setStemClampDiameter(e.target.value)}
                        required
                    >
                        <option value="">Select Diameter</option>
                        <option value="25.4mm">25.4mm</option>
                        <option value="31.8mm">31.8mm</option>
                        <option value="35mm">35mm</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Stem Length</div>
                    <select
                        className="dropdown"
                        id="stem-length"
                        name="stemLength"
                        value={stemLength}
                        onChange={(e) => setStemLength(e.target.value)}
                        required
                    >
                        <option value="">Select Length</option>
                        <option value="60mm">60mm</option>
                        <option value="70mm">70mm</option>
                        <option value="80mm">80mm</option>
                        <option value="90mm">90mm</option>
                        <option value="100mm">100mm</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Stem Angle</div>
                    <select
                        className="dropdown"
                        id="stem-angle"
                        name="stemAngle"
                        value={stemAngle}
                        onChange={(e) => setStemAngle(e.target.value)}
                        required
                    >
                        <option value="">Select Angle</option>
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Stem - Fork Diameter</div>
                    <select
                        className="dropdown"
                        id="stem-fork-diameter"
                        name="stemForkDiameter"
                        value={stemForkDiameter}
                        onChange={(e) => setStemForkDiameter(e.target.value)}
                        required
                    >
                        <option value="">Select Diameter</option>
                        <option value='1 1/8"'>1 1/8"</option>
                        <option value='1 1/4"'>1 1/4"</option>
                        <option value='1.5"'>1.5"</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Headset Type</div>
                    <select
                        className="dropdown"
                        id="headset-type"
                        name="headsetType"
                        value={headsetType}
                        onChange={(e) => setHeadsetType(e.target.value)}
                        required
                    >
                        <option value="">Select Type</option>
                        <option value="Non Tapered">Non Tapered</option>
                        <option value="Tapered">Tapered</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Headset Cup Type</div>
                    <select
                        className="dropdown"
                        id="headset-cup-type"
                        name="headsetCupType"
                        value={headsetCupType}
                        onChange={(e) => setHeadsetCupType(e.target.value)}
                        required
                    >
                        <option value="">Select Type</option>
                        <option value="Integrated">Integrated</option>
                        <option value="Non-integrated">Non-integrated</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Headset Upper Diameter</div>
                    <select
                        className="dropdown"
                        id="headset-upper-diameter"
                        name="headsetUpperDiameter"
                        value={headsetUpperDiameter}
                        onChange={(e) => setHeadsetUpperDiameter(e.target.value)}
                        required
                    >
                        <option value="">Select Diameter</option>
                        <option value="44mm">44mm</option>
                        <option value="49mm">49mm</option>
                        <option value="55mm">55mm</option>
                    </select>
                </div>

                <div className="dropdown-container d-flex justify-content-between">
                    <div className="title">Headset Lower Diameter</div>
                    <select
                        className="dropdown"
                        id="headset-lower-diameter"
                        name="headsetLowerDiameter"
                        value={headsetLowerDiameter}
                        onChange={(e) => setHeadsetLowerDiameter(e.target.value)}
                        required
                    >
                        <option value="">Select Diameter</option>
                        <option value="44mm">44mm</option>
                        <option value="55mm">55mm</option>
                        <option value="56mm">56mm</option>
                    </select>
                </div>

                 {(handlebarError || headsetTypeError )&& 
                <div className="error-message">
                    <p>{handlebarError}</p>
                    <p>{headsetTypeError}</p>
                </div>}

                <div className="submit-container">
                    <button type="submit" className="submit-btn">
                        Add
                    </button>
                </div>
            </form>
        </>
    );
};

export default CockpitForm;